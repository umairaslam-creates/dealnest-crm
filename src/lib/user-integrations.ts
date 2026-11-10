import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userIntegrations } from "@/db/schema";

export type IntegrationProvider = "openai" | "hubspot" | "google";

export type OpenAiUserSettings = {
  model: string;
  temperature: number;
  enableCopilot: boolean;
  enableScoring: boolean;
  enableEmailWriter: boolean;
  enableMeetingSummary: boolean;
};

export type GoogleUserSettings = {
  calendarSync: boolean;
  emailSync: boolean;
  autoMeetLinks: boolean;
};

const DEFAULT_OPENAI_SETTINGS: OpenAiUserSettings = {
  model: "gpt-4o",
  temperature: 0.7,
  enableCopilot: true,
  enableScoring: true,
  enableEmailWriter: true,
  enableMeetingSummary: true,
};

const DEFAULT_GOOGLE_SETTINGS: GoogleUserSettings = {
  calendarSync: true,
  emailSync: true,
  autoMeetLinks: true,
};

function encryptionKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dealnest-local-dev-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptSecret(value?: string | null) {
  if (!value) return "";
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function maskSecret(secret: string, head = 7, tail = 4) {
  if (!secret) return "";
  if (secret.length <= head + tail) return "••••••••";
  return `${secret.slice(0, head)}••••••••${secret.slice(-tail)}`;
}

function parseSettings<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return { ...fallback, ...JSON.parse(value) };
  } catch {
    return fallback;
  }
}

export async function getUserIntegration(userId: string, provider: IntegrationProvider) {
  return db.query.userIntegrations.findFirst({
    where: and(eq(userIntegrations.userId, userId), eq(userIntegrations.provider, provider)),
  });
}

export async function upsertUserIntegration(input: {
  userId: string;
  provider: IntegrationProvider;
  secret?: string;
  settings?: unknown;
}) {
  const existing = await getUserIntegration(input.userId, input.provider);
  const values = {
    encryptedSecret: input.secret ? encryptSecret(input.secret) : existing?.encryptedSecret ?? null,
    settings: input.settings ? JSON.stringify(input.settings) : existing?.settings ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(userIntegrations)
      .set(values)
      .where(eq(userIntegrations.id, existing.id));
  } else {
    await db.insert(userIntegrations).values({
      userId: input.userId,
      provider: input.provider,
      ...values,
    });
  }
}

export async function getOpenAiIntegration(userId?: string | null) {
  if (!userId) {
    return {
      settings: DEFAULT_OPENAI_SETTINGS,
      apiKey: process.env.OPENAI_API_KEY || "",
      hasUserKey: false,
      maskedKey: "",
    };
  }

  const row = await getUserIntegration(userId, "openai");
  const apiKey = decryptSecret(row?.encryptedSecret) || process.env.OPENAI_API_KEY || "";
  return {
    settings: parseSettings(row?.settings, DEFAULT_OPENAI_SETTINGS),
    apiKey,
    hasUserKey: Boolean(row?.encryptedSecret),
    maskedKey: row?.encryptedSecret ? maskSecret(decryptSecret(row.encryptedSecret)) : "",
  };
}

export async function getHubSpotIntegration(userId?: string | null) {
  if (!userId) {
    const token = process.env.HUBSPOT_TOKEN || "";
    return { token, hasUserToken: false, maskedToken: "" };
  }

  const row = await getUserIntegration(userId, "hubspot");
  const token = decryptSecret(row?.encryptedSecret) || process.env.HUBSPOT_TOKEN || "";
  return {
    token,
    hasUserToken: Boolean(row?.encryptedSecret),
    maskedToken: row?.encryptedSecret ? maskSecret(decryptSecret(row.encryptedSecret), 6, 4) : "",
  };
}

export async function getGoogleIntegrationSettings(userId?: string | null) {
  if (!userId) return DEFAULT_GOOGLE_SETTINGS;
  const row = await getUserIntegration(userId, "google");
  return parseSettings(row?.settings, DEFAULT_GOOGLE_SETTINGS);
}
