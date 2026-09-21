import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no database import here on purpose. This is what the
// proxy (middleware) uses to check "is there a valid session" on every
// request without pulling the Postgres driver into the edge runtime bundle.
// The full config with the Credentials provider (which does hit the
// database) lives in auth.ts and is only ever used in the Node runtime.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
