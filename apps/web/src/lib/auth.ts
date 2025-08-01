/* src/lib/auth.ts
   -------------------------------------------------------------- */
import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@ai-ebilling/db";
import type { User } from "next-auth";

/* ----------  Module augmentation  ---------- */
declare module "next-auth" {
  interface Session {
    user: User & { tenantId: string; firstName?: string; lastName?: string; };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    firstName?: string;
    lastName?: string;
  }
}

/* ----------  Auth.js (NextAuth) config  ---------- */
export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email + Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, tenantId: true, hashedPassword: true, firstName: true, lastName: true }
        });
        if (!user) return null;

        const ok = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        return ok ? ({ id: user.id, tenantId: user.tenantId, firstName: user.firstName, lastName: user.lastName } as const) : null;
      }
    })
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as unknown as { tenantId: string }).tenantId;
        token.firstName = (user as unknown as { firstName?: string }).firstName;
        token.lastName = (user as unknown as { lastName?: string }).lastName;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.tenantId) {
        session.user.tenantId = token.tenantId;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }
      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login?error=true"
  }
};

/*  Optional helpers for server components /
    middleware (keeps the same API you used) */
export const { auth, signIn, signOut } = NextAuth(authConfig);
