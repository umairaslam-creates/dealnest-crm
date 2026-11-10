"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { meetings } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@/auth";

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

  if (!title || !dateStr || !startTimeStr || !endTimeStr) {
    throw new Error("Title, date, start time, and end time are required.");
  }

  const start = new Date(`${dateStr}T${startTimeStr}:00`);
  const end = new Date(`${dateStr}T${endTimeStr}:00`);

  const meetingId = "meet_" + createId();

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
    googleEventId: null,
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
