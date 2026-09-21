import { NextResponse } from "next/server";
import { exchangeCodeForTokens, saveGoogleTokens } from "@/lib/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings/integrations?google=${error}`, request.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/settings/integrations?google=missing_code", request.url));
  }

  let userId: string;
  try {
    userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
  } catch {
    return NextResponse.redirect(new URL("/settings/integrations?google=bad_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    let googleEmail: string | undefined;
    try {
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (infoRes.ok) googleEmail = (await infoRes.json()).email;
    } catch {
      // non-fatal, we still have the tokens
    }
    await saveGoogleTokens(userId, tokens, googleEmail);
    return NextResponse.redirect(new URL("/settings/integrations?google=connected", request.url));
  } catch (err) {
    return NextResponse.redirect(new URL("/settings/integrations?google=exchange_failed", request.url));
  }
}
