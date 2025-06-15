/* apps/web/app/api/auth/[...nextauth]/route.ts
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
    user: User & { tenantId: string };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
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
          select: { id: true, tenantId: true, hashedPassword: true }
        });
        if (!user) return null;

        const ok = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        return ok ? ({ id: user.id, tenantId: user.tenantId } as const) : null;
      }
    })
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) token.tenantId = (user as unknown as { tenantId: string }).tenantId;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.tenantId) {
        session.user.tenantId = token.tenantId;
      }
      return session;
    }
  },

  pages: {
    signIn: "/login",
    error: "/login?error=true"
  }
};

/* ----------  Route-handler exports  ---------- */
const handler = NextAuth(authConfig);

/*  ⬇️  Tell Next.js these methods exist */
export { handler as GET, handler as POST };

/*  Optional helpers for server components /
    middleware (keeps the same API you used) */
export const { auth, signIn, signOut } = handler;
