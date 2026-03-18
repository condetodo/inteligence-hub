import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InsightsService {
  static async list(instanceId: string) {
    return prisma.insightReport.findMany({
      where: { instanceId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  }

  static async getByWeek(instanceId: string, week: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const report = await prisma.insightReport.findUnique({
      where: {
        instanceId_weekNumber_year: {
          instanceId,
          weekNumber: week,
          year: currentYear,
        },
      },
    });
    if (!report) {
      throw new AppError(404, 'Insight report not found');
    }
    return report;
  }
}
