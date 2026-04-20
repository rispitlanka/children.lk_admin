import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleDashboards: Record<string, string> = {
  admin: "/admin",
  organizer: "/organizer",
  parent: "/parent",
};

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function getAllowedOrigins(): string[] {
  const defaults = ["http://localhost:3000", "https://children-lk-v2.vercel.app"];
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? defaults.join(",");
  return raw
    .split(",")
    .map((v) => normalizeOrigin(v))
    .filter(Boolean);
}

function applyCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  const allowedOrigins = getAllowedOrigins();
  const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  const allowOrigin = allowAny
    ? (normalizedOrigin ?? "*")
    : (normalizedOrigin && allowedOrigins.includes(normalizedOrigin) ? normalizedOrigin : "");

  if (allowOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Vary", "Origin");

  return res;
}

/** System / public routes: no auth required */
function isSystemOrPublic(path: string): boolean {
  if (path === "/signin" || path === "/signup" || path === "/forgot-password" || path === "/reset-password") return true;
  if (path === "/request-organizer" || path.startsWith("/request-organizer/")) return true;
  if (path === "/media" || path.startsWith("/media/")) return true;
  if (path === "/error-404") return true;
  return false;
}

/** Role-specific dashboard prefixes */
function getRequiredRole(path: string): string | null {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/organizer")) return "organizer";
  if (path.startsWith("/parent")) return "parent";
  return null;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      return applyCorsHeaders(req, new NextResponse(null, { status: 204 }));
    }
    return applyCorsHeaders(req, NextResponse.next());
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (isSystemOrPublic(path)) {
    if (token && (path === "/signin" || path === "/signup" || path === "/forgot-password" || path === "/reset-password")) {
      const role = (token.role as string) || "parent";
      return NextResponse.redirect(new URL(roleDashboards[role] ?? "/parent", req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signIn);
  }

  const requiredRole = getRequiredRole(path);
  if (requiredRole) {
    const role = token.role as string;
    if (role !== requiredRole) {
      return NextResponse.redirect(new URL(roleDashboards[role] ?? "/parent", req.url));
    }
  }

  if (path === "/") {
    const role = (token.role as string) || "parent";
    return NextResponse.redirect(new URL(roleDashboards[role] ?? "/parent", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
