import { prisma } from './lib/prisma';
import { runCorpusBuilder } from './agents/corpusBuilder';
import { runBrandVoiceAgent } from './agents/brandVoice';
import { runContentAgent } from './agents/content';
import { runInsightsAgent } from './agents/insights';
import { runDistributionAgent } from './agents/distribution';

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

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
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();

  console.log(`\n========================================`);
  console.log(`[Orchestrator] Starting processing for instance ${instanceId}`);
  console.log(`[Orchestrator] Week ${weekNumber}, Year ${year}`);
  console.log(`========================================\n`);

  try {
    // Step 1: Corpus Builder (sequential)
    await updateStep(runId, 'corpus', 'running');
    console.log('\n--- Step 1: Corpus Builder ---');
    const corpus = await runCorpusBuilder(instanceId, weekNumber, year);
    await updateStep(runId, 'corpus', corpus ? 'completed' : 'skipped');

    if (!corpus) {
      console.log('[Orchestrator] No corpus generated (no pending inputs). Completing run.');
      await prisma.processingRun.update({
        where: { id: runId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      return;
    }

    // Step 2: Brand Voice (sequential, depends on corpus)
    await updateStep(runId, 'brandVoice', 'running');
    console.log('\n--- Step 2: Brand Voice ---');
    await runBrandVoiceAgent(instanceId, weekNumber, year);
    await updateStep(runId, 'brandVoice', 'completed');

    // Step 3: Content + Insights (parallel, both depend on corpus + brand voice)
    await updateStep(runId, 'content', 'running');
    await updateStep(runId, 'insights', 'running');
    console.log('\n--- Step 3: Content + Insights (parallel) ---');

    const [contentResults, insightsResult] = await Promise.all([
      runContentAgent(instanceId, weekNumber, year).catch((e) => {
        console.error('[Orchestrator] Content agent failed:', e.message);
        return null;
      }),
      runInsightsAgent(instanceId, weekNumber, year).catch((e) => {
        console.error('[Orchestrator] Insights agent failed:', e.message);
        return null;
      }),
    ]);

    await updateStep(runId, 'content', contentResults ? 'completed' : 'failed');
    await updateStep(runId, 'insights', insightsResult ? 'completed' : 'failed');

    // Step 4: Distribution (sequential, depends on all previous)
    await updateStep(runId, 'distribution', 'running');
    console.log('\n--- Step 4: Distribution ---');
    await runDistributionAgent(instanceId, weekNumber, year);
    await updateStep(runId, 'distribution', 'completed');

    // Mark run as completed
    await prisma.processingRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    console.log(`\n========================================`);
    console.log(`[Orchestrator] Processing COMPLETED for instance ${instanceId}`);
    console.log(`[Orchestrator] Content pieces: ${Array.isArray(contentResults) ? contentResults.length : 0}`);
    console.log(`[Orchestrator] Insights: ${insightsResult ? 'generated' : 'failed'}`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('[Orchestrator] Fatal error:', error);

    await prisma.processingRun.update({
      where: { id: runId },
      data: { status: 'FAILED', completedAt: new Date() },
    });

    throw error;
  }
}
