import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/auth/password";
import { isStaffRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
};
