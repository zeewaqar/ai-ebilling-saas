// apps/web/middleware.ts
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "@ai-ebilling/db";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const host = url.host;
  const sub = host.split(".")[0];
  const tenant = await prisma.tenant.findFirst({ where: { subdomain: sub } });

  // Unknown subdomain → landing
  if (!tenant) return NextResponse.next();

  // Dashboard requires auth
  if (url.pathname.startsWith("/dashboard")) {
    const { user } = await auth(req, NextResponse.next);
    if (!user || user.tenantId !== tenant.id) {
      return NextResponse.redirect(new URL("/login", url));
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-tenant-id", tenant.id);
  return res;
}

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
