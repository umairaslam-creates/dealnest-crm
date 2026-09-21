import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Edge-safe: uses only authConfig (no database import), per Next.js 16's
// proxy.ts convention (the renamed middleware.ts).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/pending-approval") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/models") ||
    pathname.startsWith("/Textures") ||
    pathname.startsWith("/api");

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn) {
    const userStatus = (req.auth?.user as any)?.status;
    if (userStatus === "PENDING_APPROVAL") {
      if (!pathname.startsWith("/pending-approval") && !pathname.startsWith("/api/auth")) {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    } else {
      if (pathname.startsWith("/pending-approval")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|models|Textures|.*\\.(?:glb|gltf|bin|fbx|blend|svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

