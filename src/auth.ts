import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";

async function findOrCreateGoogleUser(input: { email?: string | null; name?: string | null; image?: string | null }) {
  if (!input.email) return null;

  const email = input.email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    if (input.image && !existing.image) {
      const [updated] = await db
        .update(users)
        .set({ image: input.image })
        .where(eq(users.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const domain = email.split("@")[1] || null;
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: input.name || email.split("@")[0],
      image: input.image,
      accountType: "INDIVIDUAL",
      status: "ACTIVE",
      companyDomain: domain,
      role: "REP",
      orgRole: "REPRESENTATIVE",
    })
    .returning();
  return created;
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user?.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        department: user.department,
        orgRole: user.orgRole,
        status: user.status,
        companyDomain: user.companyDomain,
        phone: user.phone,
        designation: user.designation || user.occupation,
        image: user.image,
        permissions: user.permissions,
        themePreference: user.themePreference,
        fontPreference: user.fontPreference,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        const dbUser =
          (user as any).role && (user as any).accountType
            ? (user as any)
            : await findOrCreateGoogleUser({ email: user.email, name: user.name, image: user.image });

        token.id = dbUser?.id || (user as any).id;
        token.role = dbUser?.role;
        token.accountType = dbUser?.accountType;
        token.department = dbUser?.department;
        token.orgRole = dbUser?.orgRole;
        token.status = dbUser?.status;
        token.companyDomain = dbUser?.companyDomain;
        token.phone = dbUser?.phone;
        token.designation = dbUser?.designation || dbUser?.occupation;
        // Keep JWT cookie light: only store if lightweight string/URL, not huge base64
        token.image =
          typeof dbUser?.image === "string" && dbUser.image.length < 500
            ? dbUser.image
            : null;
        token.permissions = dbUser?.permissions;
        token.themePreference = dbUser?.themePreference;
        token.fontPreference = dbUser?.fontPreference;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accountType = token.accountType;
        (session.user as any).department = token.department;
        (session.user as any).orgRole = token.orgRole;
        (session.user as any).status = token.status;
        (session.user as any).companyDomain = token.companyDomain;
        (session.user as any).phone = token.phone;
        (session.user as any).designation = token.designation;
        (session.user as any).image = token.image;
        (session.user as any).permissions = token.permissions;
        (session.user as any).themePreference = token.themePreference;
        (session.user as any).fontPreference = token.fontPreference;

        // Fetch fresh user profile from DB so session is always accurate
        if (token.id) {
          try {
            const dbUser = await db.query.users.findFirst({
              where: eq(users.id, token.id as string),
              columns: { name: true, designation: true, occupation: true, phone: true, image: true },
            });
            if (dbUser) {
              if (dbUser.name) session.user.name = dbUser.name;
              if (dbUser.designation || dbUser.occupation) {
                (session.user as any).designation = dbUser.designation || dbUser.occupation;
              }
              if (dbUser.phone) (session.user as any).phone = dbUser.phone;
              if (dbUser.image) {
                (session.user as any).image = dbUser.image;
                session.user.image = dbUser.image;
              }
            }
          } catch (e) {
            console.error("Failed to query fresh user profile in session callback:", e);
          }
        }
      }
      return session;
    },
  },
});
