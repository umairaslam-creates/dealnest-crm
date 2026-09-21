import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getSessionUser() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  try {
    const dbUser = userId
      ? await db.query.users.findFirst({ where: eq(users.id, userId) })
      : await db.query.users.findFirst({ orderBy: [asc(users.createdAt)] });

    if (dbUser) {
      return {
        ...(session?.user || {}),
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        accountType: dbUser.accountType,
        department: dbUser.department,
        orgRole: dbUser.orgRole,
        status: dbUser.status,
        companyDomain: dbUser.companyDomain,
        phone: dbUser.phone,
        designation: dbUser.designation || dbUser.occupation || "Senior Sales Lead",
        occupation: dbUser.occupation || dbUser.designation || "Senior Sales Lead",
        image: dbUser.image,
        permissions: dbUser.permissions,
        themePreference: dbUser.themePreference,
        fontPreference: dbUser.fontPreference,
      };
    }
  } catch (err) {
    console.error("Error fetching session user from DB:", err);
  }

  return session?.user ?? null;
}
