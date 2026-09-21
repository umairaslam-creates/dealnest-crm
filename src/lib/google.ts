// Minimal Gmail + Google Calendar integration, using plain fetch against
// Google's REST/OAuth endpoints so no extra SDK is needed. Everything here
// is inert until GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set, and every
// call is triggered by a user clicking a button (Connect, Email, Schedule
// meeting) — never on a background schedule.

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { googleTokens } from "@/db/schema";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function redirectUri() {
  const base = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3311";
  return `${base}/api/integrations/google/callback`;
}

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  }>;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function saveGoogleTokens(
  userId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in: number; scope: string },
  googleEmail?: string
) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const existing = await db.query.googleTokens.findFirst({
    where: eq(googleTokens.userId, userId),
  });
  if (existing) {
    await db
      .update(googleTokens)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? existing.refreshToken,
        expiresAt,
        scope: tokens.scope,
        googleEmail: googleEmail ?? existing.googleEmail,
      })
      .where(eq(googleTokens.userId, userId));
  } else {
    await db.insert(googleTokens).values({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope: tokens.scope,
      googleEmail,
    });
  }
}

export async function disconnectGoogle(userId: string) {
  await db.delete(googleTokens).where(eq(googleTokens.userId, userId));
}

export async function getGoogleStatus(userId: string) {
  const row = await db.query.googleTokens.findFirst({ where: eq(googleTokens.userId, userId) });
  if (!row) return { connected: false as const };
  return { connected: true as const, email: row.googleEmail, connectedAt: row.connectedAt };
}

// Returns a valid access token for this user, refreshing it first if
// expired. Returns null if the user has never connected Google.
async function getValidAccessToken(userId: string): Promise<string | null> {
  const row = await db.query.googleTokens.findFirst({ where: eq(googleTokens.userId, userId) });
  if (!row) return null;

  if (row.expiresAt.getTime() > Date.now() + 60_000) {
    return row.accessToken;
  }
  if (!row.refreshToken) return row.accessToken; // best effort, will 401 downstream if truly expired

  const refreshed = await refreshAccessToken(row.refreshToken);
  await db
    .update(googleTokens)
    .set({
      accessToken: refreshed.access_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    })
    .where(eq(googleTokens.userId, userId));
  return refreshed.access_token;
}

function encodeEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const message = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=utf-8", "", body].join(
    "\r\n"
  );
  return Buffer.from(message).toString("base64url");
}

export async function sendGmail(
  userId: string,
  input: { to: string; subject: string; body: string }
) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return { ok: false as const, reason: "not_connected" as const };

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encodeEmail(input) }),
  });
  if (!res.ok) return { ok: false as const, reason: "send_failed" as const, detail: await res.text() };
  return { ok: true as const };
}

export async function createCalendarEvent(
  userId: string,
  input: { summary: string; description?: string; attendeeEmail?: string; startISO: string; endISO: string }
) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return { ok: false as const, reason: "not_connected" as const };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startISO },
      end: { dateTime: input.endISO },
      attendees: input.attendeeEmail ? [{ email: input.attendeeEmail }] : undefined,
    }),
  });
  if (!res.ok) return { ok: false as const, reason: "create_failed" as const, detail: await res.text() };
  const event = await res.json();
  return { ok: true as const, htmlLink: event.htmlLink as string | undefined };
}
