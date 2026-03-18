import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class ContentService {
  static async list(
    instanceId: string,
    filters?: { week?: number; year?: number; platform?: string; status?: string },
  ) {
    const where: any = { instanceId };
    if (filters?.week) where.weekNumber = Number(filters.week);
    if (filters?.year) where.year = Number(filters.year);
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.status) where.status = filters.status;

    return prisma.contentOutput.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(instanceId: string, contentId: string) {
    const content = await prisma.contentOutput.findFirst({
      where: { id: contentId, instanceId },
    });
    if (!content) {
      throw new AppError(404, 'Content not found');
    }
    return content;
  }

  static async updateStatus(instanceId: string, contentId: string, status: ContentStatus) {
    await ContentService.getById(instanceId, contentId);
    return prisma.contentOutput.update({
      where: { id: contentId },
      data: { status },
    });
  }

  static async update(
    instanceId: string,
    contentId: string,
    data: Partial<{ title: string; content: string; status: ContentStatus }>,
  ) {
    await ContentService.getById(instanceId, contentId);
    return prisma.contentOutput.update({
      where: { id: contentId },
      data,
    });
  }
}
