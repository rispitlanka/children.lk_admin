import fs from "node:fs";
import path from "node:path";

const API_ROOT = path.join(process.cwd(), "src", "app", "api");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;

type HttpMethod = (typeof HTTP_METHODS)[number];
type PrimitiveType = "string" | "number" | "boolean";
type OpenApiOperation = Record<string, unknown>;

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

function buildRequestBody(properties: Record<string, unknown>, required: string[] = [], example?: Record<string, unknown>) {
  return {
    required: required.length > 0,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
        ...(example ? { example } : {}),
      },
    },
  };
}

function mergeOperation(base: OpenApiOperation, override?: OpenApiOperation): OpenApiOperation {
  if (!override) return base;
  const merged = { ...base, ...override };

  if (base.responses || override.responses) {
    merged.responses = {
      ...(base.responses as Record<string, unknown> | undefined),
      ...(override.responses as Record<string, unknown> | undefined),
    };
  }

  return merged;
}

const OPERATION_OVERRIDES: Record<string, Partial<Record<Lowercase<HttpMethod>, OpenApiOperation>>> = {
  "/api/organizer/event-requests": {
    post: {
      summary: "Create organizer event request",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          slug: { type: "string", description: "Optional custom slug. If omitted, generated from event title." },
          eventCategory: { type: "string", enum: ["workshop", "conference", "seminar", "webinar", "festival", "competition", "training", "other"] },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          locationName: { type: "string" },
          locationAddress: { type: "string" },
          locationContact: { type: "string" },
          locationLatitude: { type: "number" },
          locationLongitude: { type: "number" },
          description: { type: "string", description: "HTML rich text" },
          coverImage: { type: "string", format: "uri" },
          coverImagePublicId: { type: "string" },
          highlight1: { type: "string" },
          highlight2: { type: "string" },
          highlight3: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          pricingType: { type: "string", enum: ["free", "paid"] },
          ticketOptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ticketType: { type: "string" },
                ticketPrice: { type: "number" },
              },
            },
          },
          ticketType: { type: "string" },
          ticketPrice: { type: "number" },
          registrationMode: { type: "string", enum: ["internal", "external"] },
          registrationExternalUrl: { type: "string", format: "uri" },
          internalRegistrationFields: { type: "array", items: { type: "string", enum: ["name", "email", "phone"] } },
          whoCanJoin: { type: "array", items: { type: "string" } },
        },
        ["name", "eventCategory", "startDate", "locationName", "locationAddress", "locationContact", "description", "whoCanJoin"],
        {
          name: "Children's Day Workshop",
          slug: "childrens-day-workshop",
          eventCategory: "workshop",
          startDate: "2026-05-12T09:00:00.000Z",
          endDate: "2026-05-12T12:00:00.000Z",
          locationName: "City Hall",
          locationAddress: "123 Main Street, Colombo",
          locationContact: "199",
          locationLatitude: 6.9271,
          locationLongitude: 79.8612,
          description: "<p>Hands-on event for kids.</p>",
          highlight1: "1: Interactive stations",
          highlight2: "2: Free materials",
          highlight3: "3: Parent guidance",
          tags: ["kids", "workshop"],
          pricingType: "paid",
          ticketOptions: [
            { ticketType: "General", ticketPrice: 1200 },
            { ticketType: "VIP", ticketPrice: 2500 },
          ],
          registrationMode: "external",
          registrationExternalUrl: "https://example.com/events/register",
          whoCanJoin: ["For Students", "For Teachers"],
        }
      ),
    },
  },
  "/api/admin/super-hero": {
    post: {
      summary: "Create super hero",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          color: { type: "string" },
          contactNumber: { type: "string", description: "Flexible contact field; supports short codes like 199 and numbers like +94775921581." },
          image: { type: "string", format: "uri" },
          imagePublicId: { type: "string" },
          description: { type: "string" },
          organizationId: { type: "string" },
        },
        ["name", "color", "contactNumber", "image", "description"],
        {
          name: "Fire and Rescue",
          color: "#ff0000",
          contactNumber: "199",
          image: "https://res.cloudinary.com/demo/image/upload/v1/super-hero.jpg",
          description: "Emergency response hero",
        }
      ),
    },
  },
  "/api/admin/super-hero/{id}": {
    patch: {
      summary: "Update super hero",
      requestBody: buildRequestBody({
        name: { type: "string" },
        color: { type: "string" },
        contactNumber: { type: "string", description: "Flexible contact field; supports short codes like 199 and numbers like +94775921581." },
        image: { type: "string", format: "uri" },
        imagePublicId: { type: "string" },
        description: { type: "string" },
        organizationId: { type: "string" },
      }),
    },
  },
  "/api/organizer/super-hero-requests": {
    post: {
      summary: "Create organizer super hero request",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          color: { type: "string" },
          contactNumber: { type: "string", description: "Flexible contact field; supports short codes like 199 and numbers like +94775921581." },
          image: { type: "string", format: "uri" },
          imagePublicId: { type: "string" },
          description: { type: "string" },
        },
        ["name", "color", "contactNumber", "image", "description"],
        {
          name: "Fire and Rescue",
          color: "#ff0000",
          contactNumber: "+94775921581",
          image: "https://res.cloudinary.com/demo/image/upload/v1/super-hero.jpg",
          description: "Emergency response hero",
        }
      ),
    },
  },
  "/api/organizer/resource-requests/{id}": {
    patch: {
      summary: "Update organizer resource request (draft/archived)",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          description: { type: "string", description: "HTML rich text" },
          publicationDate: { type: "string", format: "date" },
          picture: { type: "string", format: "uri" },
          picturePublicId: { type: "string" },
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                publicId: { type: "string" },
                type: { type: "string" },
                name: { type: "string" },
                fileFormat: { type: "string" },
                languages: { type: "array", items: { type: "string" } },
                fileSizeBytes: { type: "number" },
                isPrimary: { type: "boolean" },
              },
            },
          },
          tags: { type: "array", items: { type: "string" } },
          categoryId: { type: "string" },
          subCategoryId: { type: "string" },
          contentType: { type: "string" },
          ageAudienceGroups: { type: "array", items: { type: "string" } },
          mainPublisherName: { type: "string" },
          hasCoPublishers: { type: "boolean" },
          coPublisherOrganizationIds: { type: "array", items: { type: "string" } },
          rightsNotice: { type: "string" },
          externalDownloadUrl: { type: "string", format: "uri" },
          countries: { type: "array", items: { type: "string" } },
          regions: { type: "array", items: { type: "string" } },
          visibilityStatus: { type: "string", enum: ["draft", "published", "archived"] },
          contentPublishedAt: { type: "string", format: "date" },
          featured: { type: "boolean" },
          slug: { type: "string" },
        },
        ["name", "description", "categoryId", "subCategoryId", "contentType", "ageAudienceGroups", "mainPublisherName", "documents"],
      ),
    },
  },
  "/api/organizer/media-requests": {
    get: {
      summary: "List organizer media requests",
    },
    post: {
      summary: "Create organizer media request",
      requestBody: buildRequestBody(
        {
          contentType: { type: "string", enum: ["artwork", "story_poem", "video"] },
          visibilityStatus: { type: "string", enum: ["draft", "published", "archived"] },
          childInfo: {
            type: "object",
            properties: {
              fullName: { type: "string" },
              age: { type: "string" },
              gender: { type: "string" },
              city: { type: "string" },
              country: { type: "string" },
            },
          },
          guardianContact: {
            type: "object",
            properties: {
              guardianName: { type: "string" },
              phone: { type: "string" },
              relationshipToChild: { type: "string" },
            },
          },
          tags: { type: "array", items: { type: "string" } },
          artwork: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string", description: "HTML rich text" },
              medium: { type: "string" },
              dateCreated: { type: "string", format: "date" },
              theme: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              artwork: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                  publicId: { type: "string" },
                  type: { type: "string", enum: ["image"] },
                  name: { type: "string" },
                },
              },
            },
          },
          storyPoem: {
            type: "object",
            properties: {
              title: { type: "string" },
              writtenWorkType: { type: "string" },
              language: { type: "string" },
              dateWritten: { type: "string", format: "date" },
              article: { type: "string", description: "HTML rich text" },
              theme: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              coverImage: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                  publicId: { type: "string" },
                  type: { type: "string", enum: ["image"] },
                  name: { type: "string" },
                },
              },
            },
          },
          video: {
            type: "object",
            properties: {
              title: { type: "string" },
              videoType: { type: "string" },
              duration: { type: "string" },
              releasedDate: { type: "string", format: "date" },
              language: { type: "string" },
              aspectRatio: { type: "string" },
              synopsis: { type: "string", description: "HTML rich text" },
              youtubeLink: { type: "string", format: "uri" },
              theme: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              thumbnail: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                  publicId: { type: "string" },
                  type: { type: "string", enum: ["image"] },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        ["contentType", "childInfo", "guardianContact"],
      ),
    },
  },
  "/api/organizer/media-requests/{id}": {
    get: {
      summary: "Get organizer media request by ID",
    },
    patch: {
      summary: "Update organizer media request (draft/archived)",
      requestBody: buildRequestBody(
        {
          contentType: { type: "string", enum: ["artwork", "story_poem", "video"] },
          visibilityStatus: { type: "string", enum: ["draft", "published", "archived"] },
          childInfo: { type: "object" },
          guardianContact: { type: "object" },
          tags: { type: "array", items: { type: "string" } },
          artwork: { type: "object" },
          storyPoem: { type: "object" },
          video: { type: "object" },
        },
        ["contentType", "childInfo", "guardianContact"],
      ),
    },
  },
  "/api/admin/media-requests": {
    get: {
      summary: "List media requests for admin review",
    },
  },
  "/api/admin/media-requests/{id}": {
    get: {
      summary: "Get media request detail for admin",
    },
    patch: {
      summary: "Approve or deny media request",
      requestBody: buildRequestBody(
        {
          status: { type: "string", enum: ["approved", "denied"] },
          adminReason: { type: "string" },
        },
        ["status"],
      ),
    },
  },
  "/api/public/events": {
    get: {
      summary: "List public events",
    },
  },
  "/api/public/events/{id}": {
    get: {
      summary: "Get public event by ID",
    },
  },
  "/api/public/events/by-slug/{slug}": {
    get: {
      summary: "Get public event by slug",
    },
  },
  "/api/public/events/{id}/bookings": {
    post: {
      summary: "Create event booking for internal-registration events",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          ticketType: { type: "string", description: "Required for paid events" },
        },
        ["name", "email", "phone"],
        {
          name: "Alex Perera",
          email: "alex@example.com",
          phone: "+94771234567",
          ticketType: "General",
        }
      ),
    },
  },
  "/api/organizer/event-requests/{id}/bookings": {
    get: {
      summary: "List bookings for an organizer event request",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Event request ID",
        },
      ],
    },
  },
  "/api/public/super-hero": {
    get: {
      summary:
        "List public super heroes (admin-created and organizer requests after super-admin approval only; pending requests are not included)",
    },
  },
  "/api/public/super-hero/{id}": {
    get: {
      summary:
        "Get a public super hero by ID (same visibility rules as the list endpoint)",
    },
  },
  "/api/public/resource-categories": {
    get: {
      summary: "List public resource categories with subcategories",
    },
  },
  "/api/public/resources": {
    get: {
      summary: "List public resources",
    },
  },
  "/api/public/resources/{id}": {
    get: {
      summary: "Get public resource by ID",
    },
  },
  "/api/public/resources/by-slug/{slug}": {
    get: {
      summary: "Get public resource by slug",
    },
  },
  "/api/public/resources/download": {
    post: {
      summary: "Record public resource file download",
    },
  },
  "/api/public/resources/{id}/downloads": {
    get: {
      summary: "Get download counts for a public resource",
    },
  },
  "/api/public/files/cloudinary-download": {
    get: {
      summary: "Create signed Cloudinary raw download redirect",
      parameters: [
        {
          name: "publicId",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "format",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
      ],
    },
  },
  "/api/public/news-media": {
    get: {
      summary: "List public news media",
    },
  },
  "/api/public/news-media/{id}": {
    get: {
      summary: "Get public news media by ID",
    },
  },
  "/api/admin/news-media": {
    get: {
      summary: "List news media for admin",
    },
    post: {
      summary: "Create news media (supports multipart/form-data for featuredImage and files)",
    },
  },
  "/api/admin/news-media/{id}": {
    get: {
      summary: "Get news media detail for admin",
    },
    patch: {
      summary: "Update news media (supports multipart/form-data)",
    },
    delete: {
      summary: "Delete news media",
    },
  },
  "/api/admin/learning-courses": {
    get: {
      summary: "List admin learning courses",
    },
    post: {
      summary: "Create learning course",
      requestBody: buildRequestBody(
        {
          name: { type: "string" },
          slug: { type: "string", description: "Optional custom slug. Generated from name if omitted." },
          shortDescription: { type: "string" },
          description: { type: "string", description: "HTML rich text" },
          coverImage: { type: "string", format: "uri" },
          coverImagePublicId: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          ageGroup: { type: "string", enum: ["early_childhood", "middle_childhood", "adolescence"] },
          targetAudience: { type: "string", enum: ["children", "people_work_for_children"] },
          visibilityStatus: { type: "string", enum: ["draft", "published", "archived"] },
        },
        ["name", "shortDescription", "description", "coverImage", "ageGroup", "targetAudience"],
        {
          name: "Child Online Safety Essentials",
          shortDescription: "Learn how to keep children safe online.",
          description: "<p>Comprehensive guide to online safety and digital privacy for kids.</p>",
          coverImage: "https://res.cloudinary.com/demo/image/upload/v1/course.jpg",
          ageGroup: "middle_childhood",
          targetAudience: "children",
          visibilityStatus: "published",
        }
      ),
    },
  },
  "/api/admin/learning-courses/{id}": {
    get: {
      summary: "Get learning course by ID",
    },
    patch: {
      summary: "Update learning course",
      requestBody: buildRequestBody({
        name: { type: "string" },
        slug: { type: "string" },
        shortDescription: { type: "string" },
        description: { type: "string", description: "HTML rich text" },
        coverImage: { type: "string", format: "uri" },
        coverImagePublicId: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        ageGroup: { type: "string", enum: ["early_childhood", "middle_childhood", "adolescence"] },
        targetAudience: { type: "string", enum: ["children", "people_work_for_children"] },
        visibilityStatus: { type: "string", enum: ["draft", "published", "archived"] },
      }),
    },
    delete: {
      summary: "Delete learning course and cascade delete all associated lessons",
    },
  },
  "/api/admin/learning-courses/{id}/lessons": {
    get: {
      summary: "List lessons for course ordered by display position",
    },
    post: {
      summary: "Create lesson in course",
      requestBody: buildRequestBody(
        {
          title: { type: "string" },
          contentType: { type: "string", enum: ["video", "text", "quiz"] },
          visibilityStatus: { type: "string", enum: ["draft", "published"] },
          youtubeUrl: { type: "string", format: "uri", description: "Required for contentType 'video'" },
          youtubeVideoId: { type: "string", description: "11-character YouTube video ID" },
          durationSeconds: { type: "number" },
          textContent: { type: "string", description: "HTML rich text for contentType 'text'" },
          passPercentage: { type: "number", minimum: 0, maximum: 100, description: "Pass threshold for contentType 'quiz' (default: 70)" },
          quizQuestions: {
            type: "array",
            description: "Quiz question blocks (for contentType 'quiz')",
            items: {
              type: "object",
              properties: {
                questionText: { type: "string" },
                questionType: { type: "string", enum: ["single", "multiple", "true_false"] },
                points: { type: "number", default: 1 },
                explanation: { type: "string" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      isCorrect: { type: "boolean" },
                    },
                    required: ["text", "isCorrect"],
                  },
                },
              },
              required: ["questionText", "questionType", "options"],
            },
          },
        },
        ["title", "contentType"],
        {
          title: "Introduction to Child Rights",
          contentType: "quiz",
          visibilityStatus: "published",
          passPercentage: 80,
          quizQuestions: [
            {
              questionText: "What is the primary objective of UNCRC?",
              questionType: "single",
              points: 1,
              explanation: "UNCRC focuses on fundamental rights of all children.",
              options: [
                { text: "Protecting child rights globally", isCorrect: true },
                { text: "Promoting commercial trade", isCorrect: false },
              ],
            },
          ],
        }
      ),
    },
  },
  "/api/admin/learning-courses/{id}/lessons/{lessonId}": {
    get: {
      summary: "Get lesson detail by ID",
    },
    patch: {
      summary: "Update lesson detail",
      requestBody: buildRequestBody({
        title: { type: "string" },
        contentType: { type: "string", enum: ["video", "text", "quiz"] },
        visibilityStatus: { type: "string", enum: ["draft", "published"] },
        youtubeUrl: { type: "string" },
        youtubeVideoId: { type: "string" },
        durationSeconds: { type: "number" },
        textContent: { type: "string" },
        passPercentage: { type: "number" },
        quizQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              questionText: { type: "string" },
              questionType: { type: "string", enum: ["single", "multiple", "true_false"] },
              points: { type: "number" },
              explanation: { type: "string" },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    isCorrect: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      }),
    },
    delete: {
      summary: "Delete lesson and decrement parent course lesson count",
    },
  },
  "/api/admin/learning-courses/{id}/lessons/reorder": {
    patch: {
      summary: "Reorder lessons within a course",
      requestBody: buildRequestBody(
        {
          lessonIds: {
            type: "array",
            items: { type: "string" },
            description: "Ordered list of all lesson IDs in the course",
          },
        },
        ["lessonIds"],
        {
          lessonIds: ["65f123456789abcdef000001", "65f123456789abcdef000002"],
        }
      ),
    },
  },
};

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

      const override = OPERATION_OVERRIDES[apiPath]?.[method.toLowerCase() as Lowercase<HttpMethod>];
      routeItem[method.toLowerCase()] = mergeOperation(operation, override);
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
