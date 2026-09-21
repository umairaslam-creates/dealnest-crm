import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.accountType = (user as any).accountType;
        token.department = (user as any).department;
        token.orgRole = (user as any).orgRole;
        token.status = (user as any).status;
        token.companyDomain = (user as any).companyDomain;
        token.phone = (user as any).phone;
        token.designation = (user as any).designation || (user as any).occupation;
        // Keep JWT cookie light: only store if lightweight string/URL, not huge base64
        token.image =
          typeof (user as any).image === "string" && (user as any).image.length < 500
            ? (user as any).image
            : null;
        token.permissions = (user as any).permissions;
        token.themePreference = (user as any).themePreference;
        token.fontPreference = (user as any).fontPreference;
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
