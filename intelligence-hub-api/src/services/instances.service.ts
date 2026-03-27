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
    },
  ) {
    const instance = await prisma.instance.create({
      data: {
        ...data,
        users: { create: { userId } },
        brandVoice: { create: {} },
      },
      include: { brandVoice: true },
    });
    return instance;
  }

  static async list(userId: string) {
    const instances = await prisma.instance.findMany({
      where: {
        users: { some: { userId } },
        status: { not: 'ARCHIVED' },
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
      include: { brandVoice: true },
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
      status: string;
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
}
