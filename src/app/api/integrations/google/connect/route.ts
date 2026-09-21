import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/settings/integrations?google=not_configured", request.url));
  }
  // state carries the signed-in user id so the callback knows whose tokens
  // these are, without needing a separate server-side session store for it.
  const state = Buffer.from(JSON.stringify({ userId: (session.user as any).id })).toString(
    "base64url"
  );
  return NextResponse.redirect(getGoogleAuthUrl(state));
}
