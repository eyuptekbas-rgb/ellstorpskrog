import type { NextAuthConfig } from "next-auth";

const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim();

export const authConfig = {
  secret: authSecret,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
