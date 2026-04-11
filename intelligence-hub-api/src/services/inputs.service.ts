import { InputType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { runSummaryExtractor } from '../agents/summaryExtractor';

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
    const input = await prisma.inputFile.create({
      data: { ...data, instanceId, isFoundational },
    });

    // For strategic docs, kick off summary extraction in the background.
    // The POST returns immediately with the new input; the extractedSummary
    // field gets populated a few seconds later. If extraction fails, the
    // doc still exists and can be regenerated via the /extract-summary
    // endpoint. This is fire-and-forget by design — we don't want users
    // waiting on an LLM call to see their doc appear in the UI.
    if (isFoundational) {
      runSummaryExtractor(input.id).catch((e) => {
        console.error(
          `[InputsService] Background summary extraction failed for ${input.id}:`,
          e instanceof Error ? e.message : e,
        );
      });
    }

    return input;
  }

  /**
   * Regenerates the extractedSummary for an existing foundational doc.
   * Used by:
   * 1. The /extract-summary endpoint (manual retrigger from UI or script)
   * 2. Backfill of pre-existing docs that were uploaded before this feature
   */
  static async regenerateSummary(instanceId: string, inputId: string) {
    const input = await prisma.inputFile.findFirst({
      where: { id: inputId, instanceId },
    });
    if (!input) {
      throw new AppError(404, 'Input not found');
    }
    if (!input.isFoundational) {
      throw new AppError(400, 'Input is not a foundational document');
    }

    const summary = await runSummaryExtractor(inputId);
    if (!summary) {
      throw new AppError(500, 'Summary extraction failed — check server logs');
    }

    return prisma.inputFile.findUnique({ where: { id: inputId } });
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
