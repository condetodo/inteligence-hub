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

const STALE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class ProcessingService {
  /** Mark a stuck run as FAILED with a reason */
  static async failStaleRun(runId: string, steps: Record<string, string>, reason: string) {
    // Mark any still-running/pending steps as failed
    const updatedSteps = { ...steps };
    for (const key of Object.keys(updatedSteps)) {
      if (updatedSteps[key] === 'running' || updatedSteps[key] === 'pending') {
        updatedSteps[key] = 'failed';
      }
    }
    await prisma.processingRun.update({
      where: { id: runId },
      data: { status: 'FAILED', completedAt: new Date(), steps: updatedSteps },
    });
    console.log(`[ProcessingService] Run ${runId} marked as FAILED: ${reason}`);
  }

  /** Recover all RUNNING runs on server startup (they are guaranteed stale) */
  static async recoverStaleRuns() {
    const staleRuns = await prisma.processingRun.findMany({
      where: { status: 'RUNNING' },
    });
    if (staleRuns.length === 0) return;
    console.log(`[ProcessingService] Found ${staleRuns.length} stale run(s) from previous session, recovering...`);

    // Collect unique instanceIds to re-trigger after cleanup
    const instanceIds = new Set<string>();

    for (const run of staleRuns) {
      await ProcessingService.failStaleRun(
        run.id,
        (run.steps as Record<string, string>) ?? {},
        'Server restarted while run was in progress',
      );
      instanceIds.add(run.instanceId);
    }

    // Re-trigger processing for each affected instance
    for (const instanceId of instanceIds) {
      try {
        await ProcessingService.trigger(instanceId);
        console.log(`[ProcessingService] Auto-relaunched processing for instance ${instanceId}`);
      } catch (e: any) {
        console.error(`[ProcessingService] Failed to relaunch for instance ${instanceId}:`, e.message);
      }
    }
  }

  static async trigger(instanceId: string) {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const existing = await prisma.processingRun.findFirst({
      where: { instanceId, status: 'RUNNING' },
    });
    if (existing) {
      const runAge = Date.now() - new Date(existing.startedAt).getTime();
      if (runAge > STALE_TIMEOUT_MS) {
        await ProcessingService.failStaleRun(
          existing.id,
          (existing.steps as Record<string, string>) ?? {},
          `Run exceeded ${STALE_TIMEOUT_MS / 60000}-minute timeout`,
        );
      } else {
        throw new AppError(409, 'A processing run is already in progress');
      }
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
