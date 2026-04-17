import fs from "node:fs";
import path from "node:path";

const API_ROOT = path.join(process.cwd(), "src", "app", "api");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];
type PrimitiveType = "string" | "number" | "boolean";

function walkApiRoutes(dirPath: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkApiRoutes(fullPath, acc);
      continue;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      acc.push(fullPath);
    }
  }

  return acc;
}

function toOpenApiPath(routeFilePath: string): string {
  const relativePath = path.relative(API_ROOT, routeFilePath);
  const withoutRouteFile = relativePath.replace(/\/route\.ts$/, "");
  const normalized = withoutRouteFile.replace(/\[\.{3}([^\]]+)\]/g, "{$1}").replace(/\[([^\]]+)\]/g, "{$1}");

  return `/api/${normalized}`;
}

function detectMethods(routeSource: string): HttpMethod[] {
  return HTTP_METHODS.filter((method) => {
    const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`);
    return regex.test(routeSource);
  });
}

function makeOperationId(apiPath: string, method: HttpMethod): string {
  const segments = apiPath
    .replace(/^\/api\//, "")
    .split("/")
    .map((segment) => segment.replace(/[{}]/g, ""))
    .filter(Boolean);

  return `${method.toLowerCase()}_${segments.join("_")}`;
}

function extractMethodSource(routeSource: string, method: HttpMethod): string {
  const functionPattern = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b[\\s\\S]*?(?=\\nexport\\s+(?:async\\s+)?function\\s+|\\nexport\\s+const\\s+|$)`);
  const functionMatch = routeSource.match(functionPattern);
  if (functionMatch?.[0]) return functionMatch[0];

  const constPattern = new RegExp(`export\\s+const\\s+${method}\\b[\\s\\S]*?(?=\\nexport\\s+(?:async\\s+)?function\\s+|\\nexport\\s+const\\s+|$)`);
  return routeSource.match(constPattern)?.[0] ?? "";
}

function inferFieldType(methodSource: string, field: string): PrimitiveType {
  if (new RegExp(`typeof\\s+${field}\\s*===\\s*["']number["']`).test(methodSource)) return "number";
  if (new RegExp(`typeof\\s+${field}\\s*===\\s*["']boolean["']`).test(methodSource)) return "boolean";
  return "string";
}

function extractBodyFields(methodSource: string): { properties: Record<string, { type: PrimitiveType }>; required: string[] } {
  if (!/req\.json\(/.test(methodSource)) {
    return { properties: {}, required: [] };
  }

  const destructuredMatch = methodSource.match(/const\s*\{([^}]+)\}\s*=\s*body/);
  if (!destructuredMatch?.[1]) {
    return { properties: {}, required: [] };
  }

  const rawFields = destructuredMatch[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const fields = rawFields
    .map((field) => {
      const key = field.split(":")[0]?.split("=")[0]?.trim();
      return key || "";
    })
    .filter(Boolean);

  const required: string[] = [];
  const properties: Record<string, { type: PrimitiveType }> = {};

  for (const field of fields) {
    properties[field] = { type: inferFieldType(methodSource, field) };
    if (new RegExp(`!${field}\\b`).test(methodSource)) {
      required.push(field);
    }
  }

  return { properties, required };
}

function extractPathParams(apiPath: string) {
  const names = [...apiPath.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  return names.map((name) => ({
    name,
    in: "path" as const,
    required: true,
    schema: { type: "string" },
  }));
}

function extractQueryParams(methodSource: string) {
  const names = [...methodSource.matchAll(/searchParams\.get\(["'`]([^"'`]+)["'`]\)/g)].map((m) => m[1]);
  const unique = [...new Set(names)];

  return unique.map((name) => ({
    name,
    in: "query" as const,
    required: false,
    schema: { type: "string" },
  }));
}

export function buildOpenApiSpec() {
  const routeFiles = walkApiRoutes(API_ROOT);

  const paths: Record<string, Record<string, unknown>> = {};

  for (const routeFile of routeFiles) {
    const source = fs.readFileSync(routeFile, "utf8");
    const methods = detectMethods(source);
    if (methods.length === 0) continue;

    const apiPath = toOpenApiPath(routeFile);
    const routeItem: Record<string, unknown> = {};

    for (const method of methods) {
      const methodSource = extractMethodSource(source, method);
      const pathParams = extractPathParams(apiPath);
      const queryParams = extractQueryParams(methodSource);
      const bodyFields = extractBodyFields(methodSource);

      const operation: Record<string, unknown> = {
        tags: [apiPath.split("/")[2] ?? "api"],
        summary: `${method} ${apiPath}`,
        operationId: makeOperationId(apiPath, method),
        responses: {
          "200": { description: "Success" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
          "500": { description: "Internal server error" },
        },
      };

      if (pathParams.length > 0 || queryParams.length > 0) {
        operation.parameters = [...pathParams, ...queryParams];
      }

      if (Object.keys(bodyFields.properties).length > 0 && !["GET", "HEAD"].includes(method)) {
        operation.requestBody = {
          required: bodyFields.required.length > 0,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: bodyFields.properties,
                ...(bodyFields.required.length > 0 ? { required: bodyFields.required } : {}),
              },
              example: Object.fromEntries(
                Object.keys(bodyFields.properties).map((key) => [key, key.includes("id") ? "example-id" : `example-${key}`])
              ),
            },
          },
        };
      }

      routeItem[method.toLowerCase()] = operation;
    }

    paths[apiPath] = routeItem;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Children.lk Admin API",
      version: "1.0.0",
      description: "Auto-generated OpenAPI spec from Next.js App Router API routes.",
    },
    servers: [
      {
        url: "/",
        description: "Current environment",
      },
    ],
    paths,
  };
}
