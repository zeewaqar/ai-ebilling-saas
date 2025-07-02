
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tenant.upsert({
    where: { subdomain: 'localhost' },
    update: {},
    create: {
      id: 'some-tenant-id',
      name: 'Local Tenant',
      subdomain: 'localhost',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
