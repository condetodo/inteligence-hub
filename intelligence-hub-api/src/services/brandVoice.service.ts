import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class BrandVoiceService {
  static async get(instanceId: string) {
    const brandVoice = await prisma.brandVoice.findUnique({
      where: { instanceId },
    });
    if (!brandVoice) {
      throw new AppError(404, 'Brand voice not found');
    }
    return brandVoice;
  }

  static async update(
    instanceId: string,
    data: Partial<{
      identity: string;
      valueProposition: string;
      audience: string;
      voiceTone: any;
      recurringTopics: any;
      positioning: string;
      metrics: string;
      insightHistory: any;
    }>,
  ) {
    const brandVoice = await prisma.brandVoice.update({
      where: { instanceId },
      data,
    });
    return brandVoice;
  }
}
