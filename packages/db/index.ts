import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ?? (globalThis.prismaGlobal = new PrismaClient());

export default prisma;
