import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.processingRun.deleteMany();
  await prisma.insightReport.deleteMany();
  await prisma.contentOutput.deleteMany();
  await prisma.weeklyCorpus.deleteMany();
  await prisma.inputFile.deleteMany();
  await prisma.brandVoice.deleteMany();
  await prisma.userInstance.deleteMany();
  await prisma.instance.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma };
