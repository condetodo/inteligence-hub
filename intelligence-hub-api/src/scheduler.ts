import cron from 'node-cron';
import { prisma } from './lib/prisma';
import { runOrchestrator } from './orchestrator';

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function startScheduler() {
  // Run every Monday at 7:00 AM
  cron.schedule('0 7 * * 1', async () => {
    console.log('[Scheduler] Monday 7am — triggering weekly processing for all active instances');

    const instances = await prisma.instance.findMany({
      where: { status: 'ACTIVE' },
    });

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    for (const instance of instances) {
      try {
        // Check if already running
        const existing = await prisma.processingRun.findFirst({
          where: { instanceId: instance.id, status: 'RUNNING' },
        });
        if (existing) {
          console.log(`[Scheduler] Instance ${instance.name} already has a running process, skipping`);
          continue;
        }

        // Create processing run
        const run = await prisma.processingRun.create({
          data: {
            instanceId: instance.id,
            weekNumber,
            year,
            triggeredBy: 'CRON',
            steps: {
              corpus: 'pending',
              brandVoice: 'pending',
              content: 'pending',
              insights: 'pending',
              distribution: 'pending',
            },
          },
        });

        console.log(`[Scheduler] Starting processing for instance: ${instance.name}`);

        // Run orchestrator (fire and forget per instance)
        runOrchestrator(instance.id, run.id).catch((e) => {
          console.error(`[Scheduler] Failed for instance ${instance.name}:`, e.message);
        });
      } catch (error: any) {
        console.error(`[Scheduler] Error scheduling instance ${instance.name}:`, error.message);
      }
    }
  });

  console.log('[Scheduler] Cron job registered: every Monday at 7:00 AM');
}
