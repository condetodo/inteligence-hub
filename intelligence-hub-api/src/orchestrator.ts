import { prisma } from './lib/prisma';
import { runCorpusBuilder } from './agents/corpusBuilder';
import { runDistillationAgent } from './agents/distillation';
import { runContentOrchestrator, ProcessingModalConfig } from './agents/contentOrchestrator';
import { runInsightsAgent } from './agents/insights';
import { runDistributionAgent } from './agents/distribution';
import { runConsistencyChecker } from './agents/consistencyChecker';
import { getCurrentPeriodRange } from './lib/periods';

async function updateStep(runId: string, step: string, status: string) {
  const run = await prisma.processingRun.findUnique({ where: { id: runId } });
  if (!run) return;
  const steps = (run.steps as Record<string, string>) ?? {};
  steps[step] = status;
  await prisma.processingRun.update({
    where: { id: runId },
    data: { steps },
  });
}

export async function runOrchestrator(instanceId: string, runId: string) {
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const periodType = (instance as any).processingPeriod || 'WEEKLY';
  const period = getCurrentPeriodRange(periodType);
  const weekNumber = period.periodNumber;
  const year = period.year;

  console.log(`\n========================================`);
  console.log(`[Orchestrator] Starting processing for instance ${instanceId}`);
  console.log(`[Orchestrator] Period ${weekNumber}, Year ${year} (${periodType})`);
  console.log(`========================================\n`);

  try {
    // Step 1: Corpus Builder (Sonnet)
    await updateStep(runId, 'corpus', 'running');
    console.log('\n--- Step 1: Corpus Builder ---');
    const newCorpus = await runCorpusBuilder(instanceId, weekNumber, year, period.start, period.end, runId);

    const existingCorpus = !newCorpus ? await prisma.weeklyCorpus.findUnique({
      where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
    }) : newCorpus;

    await updateStep(runId, 'corpus', newCorpus ? 'completed' : existingCorpus ? 'reused' : 'skipped');

    if (!existingCorpus) {
      console.log('[Orchestrator] No corpus available. Completing run.');
      await prisma.processingRun.update({
        where: { id: runId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      return;
    }

    // Step 2: Distillation (Opus) — replaces old BrandVoice agent
    await updateStep(runId, 'distillation', 'running');
    console.log('\n--- Step 2: Distillation (KB Update) ---');
    await runDistillationAgent(instanceId, weekNumber, year, runId);
    await updateStep(runId, 'distillation', 'completed');

    // Step 2.5: Capture Brand Voice snapshot
    console.log('\n--- Step 2.5: Brand Voice Snapshot ---');
    const updatedBV = await prisma.brandVoice.findUnique({ where: { instanceId } });
    if (updatedBV) {
      const snapshotData = {
        identity: updatedBV.identity,
        valueProposition: updatedBV.valueProposition,
        audience: updatedBV.audience,
        voiceTone: updatedBV.voiceTone as any,
        recurringTopics: updatedBV.recurringTopics as any,
        positioning: updatedBV.positioning,
        metrics: updatedBV.metrics,
        topics: ((updatedBV as any).topics || []) as any,
        contacts: ((updatedBV as any).contacts || []) as any,
        narratives: ((updatedBV as any).narratives || []) as any,
      };
      await prisma.brandVoiceSnapshot.upsert({
        where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
        update: snapshotData,
        create: { instanceId, weekNumber, year, ...snapshotData },
      });
      console.log(`[Orchestrator] Brand Voice snapshot saved for week ${weekNumber}/${year}`);
    }

    // Step 3: Content + Insights (Opus, parallel)
    await updateStep(runId, 'content', 'running');
    await updateStep(runId, 'insights', 'running');
    console.log('\n--- Step 3: Content + Insights (parallel) ---');

    // Load run config (if any) to pass to content orchestrator
    const run = await prisma.processingRun.findUnique({ where: { id: runId } });
    const runConfig = run?.config as ProcessingModalConfig | null;

    const [contentResults, insightsResult] = await Promise.all([
      runContentOrchestrator(instanceId, weekNumber, year, runConfig ?? undefined, runId).catch((e) => {
        console.error('[Orchestrator] Content agent failed:', e.message);
        return null;
      }),
      runInsightsAgent(instanceId, weekNumber, year, runId).catch((e) => {
        console.error('[Orchestrator] Insights agent failed:', e.message);
        return null;
      }),
    ]);

    await updateStep(runId, 'content', contentResults ? 'completed' : 'failed');
    await updateStep(runId, 'insights', insightsResult ? 'completed' : 'failed');

    // Step 3.5: Consistency Check (Sonnet)
    await updateStep(runId, 'consistency', 'running');
    console.log('\n--- Step 3.5: Consistency Check ---');
    try {
      await runConsistencyChecker(instanceId, weekNumber, year, runId);
      await updateStep(runId, 'consistency', 'completed');
    } catch (e) {
      console.error('[Orchestrator] Consistency checker failed:', e instanceof Error ? e.message : e);
      await updateStep(runId, 'consistency', 'failed');
    }

    // Step 4: Distribution (Sonnet)
    await updateStep(runId, 'distribution', 'running');
    console.log('\n--- Step 4: Distribution ---');
    await runDistributionAgent(instanceId, weekNumber, year, runId);
    await updateStep(runId, 'distribution', 'completed');

    await prisma.processingRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    console.log(`\n========================================`);
    console.log(`[Orchestrator] Processing COMPLETED for instance ${instanceId}`);
    console.log(`========================================\n`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Orchestrator] Fatal error:', errorMsg);

    const currentRun = await prisma.processingRun.findUnique({ where: { id: runId } });
    const currentSteps = (currentRun?.steps as Record<string, string>) ?? {};
    await prisma.processingRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        steps: { ...currentSteps, error: errorMsg },
      },
    });
    throw error;
  }
}
