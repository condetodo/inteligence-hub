import { prisma } from '../lib/prisma';

export async function runDistributionAgent(instanceId: string, weekNumber: number, year: number, runId?: string) {
  console.log(`[Distribution] Processing distribution for instance ${instanceId}, week ${weekNumber}/${year}`);

  // MVP: Mark all new content as DRAFT (already the default)
  // Future: Push to Notion, Gmail drafts, social media schedulers, etc.

  const content = await prisma.contentOutput.findMany({
    where: { instanceId, weekNumber, year, status: 'DRAFT' },
  });

  const insights = await prisma.insightReport.findFirst({
    where: { instanceId, weekNumber, year },
  });

  console.log(`[Distribution] Found ${content.length} content pieces and ${insights ? 1 : 0} insight reports`);
  console.log('[Distribution] MVP: All content marked as DRAFT for manual review');

  // Future integrations would go here:
  // - Push to Notion database
  // - Create Gmail drafts
  // - Schedule on Buffer/Hootsuite
  // - Send Slack notification

  return {
    contentCount: content.length,
    insightsGenerated: !!insights,
    distributed: false, // MVP: not yet distributed
    message: 'Content ready for review in dashboard',
  };
}
