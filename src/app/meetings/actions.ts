"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { meetings, contacts, Meeting, users } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@/auth";
import { createCalendarEvent } from "@/lib/google";

export async function createMeetingAction(formData: FormData) {
  const session = await auth();
  const currentUserId = (session?.user as any)?.id;

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const meetingType = (formData.get("meetingType") as string) || "DEMO";
  const contactId = (formData.get("contactId") as string) || null;
  const dealId = (formData.get("dealId") as string) || null;
  const dateStr = formData.get("date") as string; // YYYY-MM-DD
  const startTimeStr = formData.get("startTime") as string; // HH:mm
  const endTimeStr = formData.get("endTime") as string; // HH:mm
  const location = (formData.get("location") as string) || "Google Meet";
  const color = (formData.get("color") as string) || "blue";
  const syncGoogle = formData.get("syncGoogle") === "true";

  if (!title || !dateStr || !startTimeStr || !endTimeStr) {
    throw new Error("Title, date, start time, and end time are required.");
  }

  const start = new Date(`${dateStr}T${startTimeStr}:00`);
  const end = new Date(`${dateStr}T${endTimeStr}:00`);

  const meetingId = "meet_" + createId();
  let googleEventId: string | null = null;

  // If syncGoogle requested and user is authenticated
  if (syncGoogle && currentUserId) {
    let attendeeEmail: string | undefined;
    if (contactId) {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, contactId),
      });
      attendeeEmail = contact?.email || undefined;
    }

    try {
      const gRes = await createCalendarEvent(currentUserId, {
        summary: title,
        description,
        attendeeEmail,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      });
      if (gRes.ok && gRes.htmlLink) {
        googleEventId = gRes.htmlLink;
      }
    } catch (e) {
      console.warn("Google Calendar sync skipped/failed:", e);
    }
  }

  await db.insert(meetings).values({
    id: meetingId,
    title,
    description,
    meetingType,
    startTime: start,
    endTime: end,
    contactId,
    dealId,
    userId: currentUserId,
    googleEventId,
    location,
    status: "SCHEDULED",
    color,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/meetings");
  revalidatePath("/");
  return { success: true, id: meetingId };
}

export async function updateMeetingAction(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const meetingType = (formData.get("meetingType") as string) || "DEMO";
  const dateStr = formData.get("date") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const location = (formData.get("location") as string) || "Google Meet";
  const color = (formData.get("color") as string) || "blue";
  const status = (formData.get("status") as string) || "SCHEDULED";

  const start = new Date(`${dateStr}T${startTimeStr}:00`);
  const end = new Date(`${dateStr}T${endTimeStr}:00`);

  await db
    .update(meetings)
    .set({
      title,
      description,
      meetingType,
      startTime: start,
      endTime: end,
      location,
      color,
      status,
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, id));

  revalidatePath("/meetings");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMeetingAction(id: string) {
  await db.delete(meetings).where(eq(meetings.id, id));
  revalidatePath("/meetings");
  revalidatePath("/");
  return { success: true };
}

