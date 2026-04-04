import { InputType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InputsService {
  static async list(instanceId: string, status?: string) {
    const where: any = { instanceId };
    if (status) where.status = status;

    return prisma.inputFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  static async create(
    instanceId: string,
    data: { type: InputType; filename: string; content: string },
  ) {
    const isFoundational = data.type === 'STRATEGIC_DOC' ? true : false;
    return prisma.inputFile.create({
      data: { ...data, instanceId, isFoundational },
    });
  }

  static async delete(instanceId: string, inputId: string) {
    const input = await prisma.inputFile.findFirst({
      where: { id: inputId, instanceId },
    });
    if (!input) {
      throw new AppError(404, 'Input not found');
    }
    await prisma.inputFile.delete({ where: { id: inputId } });
    return { deleted: true };
  }
}
