/* apps/web/app/api/auth/[...nextauth]/route.ts
   -------------------------------------------------------------- */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

/* ----------  Route-handler exports  ---------- */
const handler = NextAuth(authConfig);

/*  ⬇️  Tell Next.js these methods exist */
export { handler as GET, handler as POST };