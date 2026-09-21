"use server";

import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(formData: {
  name: string;
  designation?: string;
  phone?: string;
  image?: string;
}) {
  const session = await auth();
  let userId = (session?.user as any)?.id;

  if (!userId) {
    const primaryUser = await db.query.users.findFirst();
    userId = primaryUser?.id;
  }

  if (!userId) {
    return { success: false, error: "Not authenticated. Please sign in." };
  }

  const cleanName = formData.name.trim();
  if (!cleanName) {
    return { success: false, error: "Full Name is required." };
  }

  const cleanDesignation = formData.designation?.trim() || "Senior Sales Lead";
  const cleanPhone = formData.phone?.trim() || null;
  const cleanImage = formData.image?.trim() || null;

  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: cleanName,
        designation: cleanDesignation,
        occupation: cleanDesignation,
        phone: cleanPhone,
        image: cleanImage,
      })
      .where(eq(users.id, userId))
      .returning();

    revalidatePath("/", "layout");

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        designation: updatedUser.designation || updatedUser.occupation,
        phone: updatedUser.phone,
        image: updatedUser.image,
      },
    };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}

