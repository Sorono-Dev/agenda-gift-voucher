// server/lib/prisma.ts
// Assumes Prisma client generated to custom location as shown in the logs

import { PrismaClient } from '../generated/prisma';

export const prisma = new PrismaClient();

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
