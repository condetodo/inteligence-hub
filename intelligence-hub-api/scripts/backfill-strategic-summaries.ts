/**
 * One-shot script: backfills extractedSummary for foundational docs that
 * were uploaded before the auto-extraction feature existed (pre ec3146a).
 *
 * Run inside Railway (needs network access to postgres.railway.internal):
 *   railway run --service inteligence-hub npx tsx scripts/backfill-strategic-summaries.ts
 *
 * Safe to re-run: only touches docs where extractedSummary IS NULL.
 * Already-extracted docs are left alone. Use POST /extract-summary for
 * manual re-extraction of specific docs.
 */
import { prisma } from '../src/lib/prisma';
import { runSummaryExtractor } from '../src/agents/summaryExtractor';

async function main() {
  const pending = await prisma.inputFile.findMany({
    where: { isFoundational: true, extractedSummary: null },
    select: { id: true, label: true, filename: true, instanceId: true, content: true },
  });

  console.log(`Found ${pending.length} foundational doc(s) without a summary.`);
  if (pending.length === 0) {
    console.log('Nothing to backfill. Exiting.');
    return;
  }

  for (const d of pending) {
    const label = d.label || d.filename || d.id.slice(0, 8);
    console.log(`\n---\nProcessing "${label}" (instance ${d.instanceId.slice(0, 10)}, ${d.content.length} chars)`);
    const summary = await runSummaryExtractor(d.id);
    if (summary) {
      console.log(`✓ Summary saved (${summary.length} chars)`);
    } else {
      console.log(`✗ Extraction failed (see logs above)`);
    }
  }

  console.log(`\n---\nDone.`);
}

main()
  .catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
