import { Platform } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class AgentPromptConfigService {
  static async getAll(instanceId: string) {
    return prisma.agentPromptConfig.findMany({ where: { instanceId } });
  }

  static async getForPlatform(instanceId: string, platform: string) {
    return prisma.agentPromptConfig.findUnique({
      where: { instanceId_platform: { instanceId, platform: platform as Platform } },
    });
  }

  static async upsert(
    instanceId: string,
    platform: string,
    data: {
      styleSliders?: any;
      styleInstructions?: string;
      referenceExamples?: string;
      restrictions?: string[];
    },
  ) {
    const fields: Record<string, unknown> = {};
    if (data.styleSliders !== undefined) fields.styleSliders = data.styleSliders;
    if (data.styleInstructions !== undefined) fields.styleInstructions = data.styleInstructions;
    if (data.referenceExamples !== undefined) fields.referenceExamples = data.referenceExamples;
    if (data.restrictions !== undefined) fields.restrictions = data.restrictions;

    return prisma.agentPromptConfig.upsert({
      where: { instanceId_platform: { instanceId, platform: platform as Platform } },
      create: { instanceId, platform: platform as Platform, ...fields },
      update: fields,
    });
  }
}
