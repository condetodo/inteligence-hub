import { InstanceStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InstancesService {
  static async create(
    userId: string,
    data: {
      name: string;
      clientName: string;
      clientRole: string;
      company: string;
      industry: string;
      processingPeriod?: string;
      activeWindow?: number;
      platforms?: Array<{
        platform: string;
        enabled: boolean;
        postsPerPeriod: number;
        threadsPerPeriod?: number | null;
      }>;
    },
  ) {
    const { platforms, processingPeriod, activeWindow, ...instanceData } = data;

    const defaultPlatforms = [
      { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
      { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
      { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
      { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
    ];

    const platformConfigs = platforms || defaultPlatforms;

    const instance = await prisma.instance.create({
      data: {
        ...instanceData,
        ...(processingPeriod && { processingPeriod: processingPeriod as any }),
        ...(activeWindow && { activeWindow }),
        users: { create: { userId } },
        brandVoice: { create: {} },
        platformConfigs: {
          create: platformConfigs.map((p) => ({
            platform: p.platform as any,
            enabled: p.enabled,
            postsPerPeriod: p.postsPerPeriod,
            threadsPerPeriod: p.threadsPerPeriod,
          })),
        },
      },
      include: { brandVoice: true, platformConfigs: true },
    });
    return instance;
  }

  static async list(userId: string) {
    const instances = await prisma.instance.findMany({
      where: {
        users: { some: { userId } },
      },
      include: {
        _count: {
          select: {
            inputs: { where: { status: 'PENDING' } },
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return instances;
  }

  static async getById(userId: string, instanceId: string) {
    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        users: { some: { userId } },
      },
      include: { brandVoice: true, platformConfigs: true },
    });
    if (!instance) {
      throw new AppError(404, 'Instance not found');
    }
    return instance;
  }

  static async update(
    userId: string,
    instanceId: string,
    data: Partial<{
      name: string;
      clientName: string;
      clientRole: string;
      company: string;
      industry: string;
      status: InstanceStatus;
    }>,
  ) {
    await InstancesService.getById(userId, instanceId);
    const updated = await prisma.instance.update({
      where: { id: instanceId },
      data,
    });
    return updated;
  }

  static async archive(userId: string, instanceId: string) {
    await InstancesService.getById(userId, instanceId);
    const archived = await prisma.instance.update({
      where: { id: instanceId },
      data: { status: 'ARCHIVED' },
    });
    return archived;
  }

  static async destroy(userId: string, instanceId: string) {
    await InstancesService.getById(userId, instanceId);
    await prisma.instance.delete({ where: { id: instanceId } });
  }
}
