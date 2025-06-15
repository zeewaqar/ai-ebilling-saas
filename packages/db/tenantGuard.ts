// packages/db/tenantGuard.ts
import { prisma } from ".";

export const dbFor = (tenantId: string) =>
  prisma.$extends({
    query: {
      $allModels: {
        /* READ ops -------------------------------------------------- */
        findMany({ args, query }) {
          args.where = { ...(args.where ?? {}), tenantId };
          return query(args);
        },
        findUnique({ args, query }) {
          args.where = { ...(args.where ?? {}), tenantId };
          return query(args);
        },
        findFirst({ args, query }) {
          args.where = { ...(args.where ?? {}), tenantId };
          return query(args);
        },
        count({ args, query }) {
          args.where = { ...(args.where ?? {}), tenantId };
          return query(args);
        }

        /* You can keep adding: updateMany, deleteMany, aggregate, … */
      }
    }
  });
