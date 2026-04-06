import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { generateImage } from '../lib/nanoBanana';
import { logUsage } from '../lib/usageLogger';

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

  static async updateStatus(instanceId: string, contentId: string, status: ContentStatus, approvalNotes?: string) {
    const content = await ContentService.getById(instanceId, contentId);
    const updateData: any = { status };
    if (approvalNotes && (status === 'APPROVED' || status === 'PUBLISHED')) {
      updateData.approvalNotes = approvalNotes;
    }

    // Generate image on REVIEW → APPROVED transition
    if (
      status === 'APPROVED' &&
      content.status === 'REVIEW' &&
      content.imagePrompt &&
      !content.imageUrl
    ) {
      try {
        const img = await generateImage(content.imagePrompt);
        updateData.imageUrl = `data:${img.mimeType};base64,${img.base64}`;

        await logUsage({
          instanceId,
          provider: 'google',
          model: img.usage.model,
          stepName: 'image',
          inputTokens: img.usage.inputTokens,
          outputTokens: img.usage.outputTokens,
        }).catch((e) => console.error('[ContentService] Usage logging failed:', e.message));
      } catch (e: any) {
        console.error(`[ContentService] Image generation failed for ${contentId}:`, e.message);
      }
    }

    return prisma.contentOutput.update({
      where: { id: contentId },
      data: updateData,
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
