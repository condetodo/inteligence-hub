import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class CorpusService {
  static async list(instanceId: string) {
    return prisma.weeklyCorpus.findMany({
      where: { instanceId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  }

  static async getByWeek(instanceId: string, week: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const corpus = await prisma.weeklyCorpus.findUnique({
      where: {
        instanceId_weekNumber_year: {
          instanceId,
          weekNumber: week,
          year: currentYear,
        },
      },
    });
    if (!corpus) {
      throw new AppError(404, 'Corpus not found');
    }
    return corpus;
  }
}
