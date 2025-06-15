"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@ai-ebilling/db";

/* ---------- SIGN-UP ---------- */
export async function signUpAction(_: unknown, fd: FormData) {
  const email = String(fd.get("email")).toLowerCase();
  const pwd   = String(fd.get("password"));

  if (!email || !pwd) return { error: "Email & password required" };

  if (await prisma.user.findUnique({ where: { email } }))
    return { error: "Email already registered" };

  const hash = await bcrypt.hash(pwd, 10);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: email.split("@")[0], subdomain: crypto.randomUUID().slice(0, 8) }
    });
    await tx.user.create({ data: { email, hashedPassword: hash, tenantId: tenant.id } });
  });

  /* ✅  Tell the client page we’re done and pass creds */
  return { ok: true, email, pwd };
}

/* ---------- SIGN-IN ---------- */
export async function checkUserExists(_: unknown, fd: FormData) {
  // (optional) server-side validation before we let the client call signIn()
  const email = String(fd.get("email")).toLowerCase();
  const pwd   = String(fd.get("password"));

  const user = await prisma.user.findUnique({
    where: { email },
    select: { hashedPassword: true }
  });
  if (!user || !(await bcrypt.compare(pwd, user.hashedPassword)))
    return { error: "Invalid credentials" };

  return { ok: true, email, pwd };
}
