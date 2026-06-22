import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { normalizePhone } from "@/lib/account/phone";
import { verifyPassword } from "@/lib/auth/password";
import { isCustomerRole, isStaffRole } from "@/lib/auth/roles";
import { logStaffLogin } from "@/lib/staff/staff-service";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
      }

      if (!token.id || !session.user) {
        return session;
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            forceLogoutBefore: true,
            staffStatus: true,
            role: true,
          },
        });

        if (
          user &&
          user.role !== UserRole.PLATFORM_ADMIN &&
          user.staffStatus === "INACTIVE"
        ) {
          return { expires: session.expires };
        }

        if (
          user?.forceLogoutBefore &&
          token.iat &&
          user.forceLogoutBefore.getTime() / 1000 > token.iat
        ) {
          return { expires: session.expires };
        }
      } catch {
        // Allow session when staff security fields are unavailable (e.g. pending migration).
      }

      return session;
    },
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        if (
          !user ||
          !user.passwordHash ||
          !isStaffRole(user.role) ||
          !(await verifyPassword(password, user.passwordHash))
        ) {
          return null;
        }

        if (user.staffStatus === "INACTIVE") {
          return null;
        }

        try {
          await logStaffLogin(user.id, user.tenantId);
        } catch {
          // Login still succeeds if staff activity tables are unavailable.
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
    Credentials({
      id: "customer-credentials",
      name: "customer-credentials",
      credentials: {
        identifier: { label: "E-post eller telefon", type: "text" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.toString().trim();
        const password = credentials?.password?.toString();

        if (!identifier || !password) return null;

        const email = identifier.includes("@")
          ? identifier.toLowerCase()
          : null;
        const phone = email ? null : normalizePhone(identifier);

        const user = await prisma.user.findFirst({
          where: {
            role: UserRole.CUSTOMER,
            OR: [
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          },
        });

        if (
          !user ||
          !user.passwordHash ||
          !isCustomerRole(user.role) ||
          !(await verifyPassword(password, user.passwordHash))
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
});

export type AppSessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
};
