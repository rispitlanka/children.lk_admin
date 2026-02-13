import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleDashboards: Record<string, string> = {
  admin: "/admin",
  organizer: "/organizer",
  parent: "/parent",
};

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
  matcher: ["/((?!_next|api).*)"],
};
