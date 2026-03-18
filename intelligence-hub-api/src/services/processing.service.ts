import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { runOrchestrator } from '../orchestrator';

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export class ProcessingService {
  static async trigger(instanceId: string) {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const existing = await prisma.processingRun.findFirst({
      where: { instanceId, status: 'RUNNING' },
    });
    if (existing) {
      throw new AppError(409, 'A processing run is already in progress');
    }

    const run = await prisma.processingRun.create({
      data: {
        instanceId,
        weekNumber,
        year,
        triggeredBy: 'MANUAL',
        steps: {
          corpus: 'pending',
          brandVoice: 'pending',
          content: 'pending',
          insights: 'pending',
          distribution: 'pending',
        },
      },
    });

    // Fire and forget: run orchestrator in background
    runOrchestrator(instanceId, run.id).catch((e) => {
      console.error(`[ProcessingService] Orchestrator failed:`, e.message);
    });

    return run;
  }

  static async listRuns(instanceId: string) {
    return prisma.processingRun.findMany({
      where: { instanceId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  static async getRun(instanceId: string, runId: string) {
    const run = await prisma.processingRun.findFirst({
      where: { id: runId, instanceId },
    });
    if (!run) {
      throw new AppError(404, 'Processing run not found');
    }
    return run;
  }
}
