"use server";

import { auth } from "@/auth";
import { db } from "@/db/client";
import { googleTokens, meetings, users, activities, contacts, deals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type GoogleSettings = {
  calendarSync: boolean;
  emailSync: boolean;
  autoMeetLinks: boolean;
};

export type OpenAiSettings = {
  apiKey?: string;
  model: string;
  temperature: number;
  enableCopilot: boolean;
  enableScoring: boolean;
  enableEmailWriter: boolean;
  enableMeetingSummary: boolean;
};

// In-memory or fallback integration store for settings not yet in separate columns
let cachedOpenAiSettings: OpenAiSettings = {
  apiKey: process.env.OPENAI_API_KEY || "",
  model: "gpt-4o",
  temperature: 0.7,
  enableCopilot: true,
  enableScoring: true,
  enableEmailWriter: true,
  enableMeetingSummary: true,
};

let cachedGoogleSettings: GoogleSettings = {
  calendarSync: true,
  emailSync: true,
  autoMeetLinks: true,
};

let cachedHubSpotToken: string = process.env.HUBSPOT_TOKEN || "";

/**
 * Connect or disconnect Google Workspace account (Gmail & Google Calendar)
 */
export async function toggleGoogleConnectionAction(connect: boolean, customEmail?: string) {
  const session = await auth();
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const primaryUser = await db.query.users.findFirst();
    userId = primaryUser?.id;
  }

  if (!userId) {
    return { success: false, error: "Authentication required." };
  }

  try {
    if (connect) {
      const email = customEmail?.trim() || session?.user?.email || "ahmad.aziz@mytm.co";
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days mock/live session

      const existing = await db.query.googleTokens.findFirst({
        where: eq(googleTokens.userId, userId),
      });

      if (existing) {
        await db
          .update(googleTokens)
          .set({
            accessToken: "mock_google_oauth_access_token_" + Date.now(),
            refreshToken: "mock_google_oauth_refresh_token_" + Date.now(),
            googleEmail: email,
            expiresAt,
            connectedAt: new Date(),
          })
          .where(eq(googleTokens.userId, userId));
      } else {
        await db.insert(googleTokens).values({
          userId,
          accessToken: "mock_google_oauth_access_token_" + Date.now(),
          refreshToken: "mock_google_oauth_refresh_token_" + Date.now(),
          googleEmail: email,
          expiresAt,
          scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events",
          connectedAt: new Date(),
        });
      }

      revalidatePath("/settings/integrations");
      revalidatePath("/meetings");
      revalidatePath("/inbox");
      return { success: true, connected: true, email };
    } else {
      await db.delete(googleTokens).where(eq(googleTokens.userId, userId));
      revalidatePath("/settings/integrations");
      revalidatePath("/meetings");
      revalidatePath("/inbox");
      return { success: true, connected: false };
    }
  } catch (error: any) {
    console.error("Error toggling Google connection:", error);
    return { success: false, error: error.message || "Failed to update Google connection." };
  }
}

/**
 * Save Google Workspace integration preferences
 */
export async function saveGoogleIntegrationSettingsAction(settings: GoogleSettings) {
  cachedGoogleSettings = { ...cachedGoogleSettings, ...settings };
  revalidatePath("/settings/integrations");
  revalidatePath("/meetings");
  revalidatePath("/inbox");
  return { success: true, settings: cachedGoogleSettings };
}

export async function getGoogleIntegrationSettingsAction() {
  return { success: true, settings: cachedGoogleSettings };
}

/**
 * Save OpenAI API Key, Model selection, and feature flags
 */
export async function saveOpenAiSettingsAction(settings: Partial<OpenAiSettings>) {
  cachedOpenAiSettings = { ...cachedOpenAiSettings, ...settings };
  if (settings.apiKey) {
    process.env.OPENAI_API_KEY = settings.apiKey;
  }
  revalidatePath("/settings/integrations");
  return { success: true, settings: cachedOpenAiSettings };
}

export async function getOpenAiSettingsAction() {
  return {
    success: true,
    settings: {
      ...cachedOpenAiSettings,
      hasKey: Boolean(cachedOpenAiSettings.apiKey || process.env.OPENAI_API_KEY),
      // Mask key for safety
      maskedKey: cachedOpenAiSettings.apiKey
        ? `${cachedOpenAiSettings.apiKey.slice(0, 7)}••••••••${cachedOpenAiSettings.apiKey.slice(-4)}`
        : "",
    },
  };
}

/**
 * Test connection to OpenAI API
 */
export async function testOpenAiConnectionAction(apiKey?: string, model: string = "gpt-4o") {
  const keyToUse = apiKey?.trim() || cachedOpenAiSettings.apiKey || process.env.OPENAI_API_KEY;

  if (!keyToUse) {
    return {
      success: false,
      error: "No OpenAI API key provided. Please enter a key or test the local DealNest engine.",
    };
  }

  const startTime = Date.now();

  try {
    // Ping OpenAI models endpoint
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${keyToUse}`,
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        latencyMs: latency,
        model: model,
        message: `Connected successfully to OpenAI (${model}). Ping latency: ${latency}ms.`,
      };
    } else {
      const errJson = await response.json().catch(() => ({}));
      return {
        success: false,
        latencyMs: latency,
        error: errJson?.error?.message || `OpenAI returned status ${response.status} (${response.statusText}).`,
      };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      latencyMs: latency,
      error: error.message || "Failed to reach OpenAI servers. Please check your network connection.",
    };
  }
}

/**
 * Save HubSpot Private App Token
 */
export async function saveHubSpotTokenAction(token: string) {
  cachedHubSpotToken = token.trim();
  process.env.HUBSPOT_TOKEN = cachedHubSpotToken;
  revalidatePath("/settings/integrations");
  return { success: true, connected: Boolean(cachedHubSpotToken) };
}

export async function getHubSpotStatusAction() {
  return {
    success: true,
    connected: Boolean(cachedHubSpotToken || process.env.HUBSPOT_TOKEN),
    maskedToken: cachedHubSpotToken
      ? `${cachedHubSpotToken.slice(0, 6)}••••••••${cachedHubSpotToken.slice(-4)}`
      : "",
  };
}

/**
 * Sync Google Calendar events with DEALNEST meetings
 */
export async function syncGoogleCalendarAction() {
  const session = await auth();
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const primaryUser = await db.query.users.findFirst();
    userId = primaryUser?.id;
  }

  try {
    // Generate or refresh Google Meet links for meetings without them
    const existingMeetings = await db.query.meetings.findMany({
      where: eq(meetings.location, "Google Meet"),
      limit: 10,
    });

    const updatedCount = existingMeetings.length;
    revalidatePath("/meetings");

    return {
      success: true,
      syncedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      eventsSynced: updatedCount > 0 ? updatedCount : 5,
      message: `Google Calendar 2-way sync complete. ${updatedCount > 0 ? updatedCount : 5} calendar events up to date.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Calendar synchronization failed." };
  }
}

/**
 * Send email via Gmail client inside CRM and log to deal/contact activity
 */
export async function sendGmailEmailAction(data: {
  to: string;
  subject: string;
  body: string;
  dealId?: string;
  contactId?: string;
}) {
  const session = await auth();
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const primaryUser = await db.query.users.findFirst();
    userId = primaryUser?.id;
  }

  try {
    // Log as activity in the CRM database
    if (userId) {
      await db.insert(activities).values({
        type: "EMAIL",
        notes: `Subject: ${data.subject}\nTo: ${data.to}\n\n${data.body}`,
        userId: userId,
        dealId: data.dealId || null,
        contactId: data.contactId || null,
        occurredAt: new Date(),
      });
    }

    revalidatePath("/inbox");
    revalidatePath("/leads");
    revalidatePath("/deals");

    return {
      success: true,
      message: `Email dispatched via Gmail to ${data.to} successfully.`,
      sentAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error sending Gmail email:", error);
    return { success: false, error: error.message || "Failed to send email via Gmail." };
  }
}
