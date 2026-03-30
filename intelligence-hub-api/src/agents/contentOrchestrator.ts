import { prisma } from '../lib/prisma';
import { runLinkedInAgent } from './linkedinAgent';
import { runXAgent } from './xAgent';
import { runTikTokAgent } from './tiktokAgent';
import { runBlogAgent } from './blogAgent';

export async function runContentOrchestrator(
  instanceId: string,
  weekNumber: number,
  year: number,
): Promise<any[]> {
  console.log(
    `[ContentOrchestrator] Generating content for instance ${instanceId}, week ${weekNumber}/${year}`,
  );

  // ── Load shared data ───────────────────────────────────────────────

  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });

  if (!brandVoice || !corpus) {
    console.log('[ContentOrchestrator] Missing brand voice or corpus, skipping');
    return [];
  }

  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  const activeWindow = (instance as any)?.activeWindow ?? 8;

  // Load platform configs for dynamic agent dispatch
  let platformConfigs = await prisma.instancePlatformConfig.findMany({
    where: { instanceId },
  });

  // Backward compatibility: if no configs exist, use defaults
  if (platformConfigs.length === 0) {
    platformConfigs = [
      { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null } as any,
      { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 } as any,
      { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null } as any,
      { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null } as any,
    ];
  }

  const recentCorpuses = await prisma.weeklyCorpus.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
    take: activeWindow,
  });

  const brandVoiceData = {
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
    topics: (brandVoice as any).topics || [],
    contacts: (brandVoice as any).contacts || [],
    narratives: (brandVoice as any).narratives || [],
  };

  const corpusData = {
    current: {
      summary: corpus.summary,
      topics: corpus.topics,
      decisions: corpus.decisions,
      concerns: corpus.concerns,
      opportunities: corpus.opportunities,
    },
    activeMemory: recentCorpuses.map((c) => ({
      period: c.weekNumber,
      year: c.year,
      summary: c.summary,
      topics: c.topics,
    })),
  };

  // ── Dispatch enabled agents in parallel ────────────────────────────

  const getConfig = (platform: string) =>
    platformConfigs.find((c) => c.platform === platform);

  const tasks: Promise<any[]>[] = [];
  const taskLabels: string[] = [];

  const linkedInConfig = getConfig('LINKEDIN');
  if (linkedInConfig?.enabled) {
    tasks.push(
      runLinkedInAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: linkedInConfig.postsPerPeriod,
      }).catch((e) => {
        console.error('[ContentOrchestrator] LinkedIn failed:', e.message);
        return [];
      }),
    );
    taskLabels.push('LINKEDIN');
  }

  const xConfig = getConfig('X');
  if (xConfig?.enabled) {
    tasks.push(
      runXAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: xConfig.postsPerPeriod,
        threadsPerPeriod: xConfig.threadsPerPeriod ?? 1,
      }).catch((e) => {
        console.error('[ContentOrchestrator] X failed:', e.message);
        return [];
      }),
    );
    taskLabels.push('X');
  }

  const tiktokConfig = getConfig('TIKTOK');
  if (tiktokConfig?.enabled) {
    tasks.push(
      runTikTokAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: tiktokConfig.postsPerPeriod,
      }).catch((e) => {
        console.error('[ContentOrchestrator] TikTok failed:', e.message);
        return [];
      }),
    );
    taskLabels.push('TIKTOK');
  }

  const blogConfig = getConfig('BLOG');
  if (blogConfig?.enabled) {
    tasks.push(
      runBlogAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: blogConfig.postsPerPeriod,
      }).catch((e) => {
        console.error('[ContentOrchestrator] Blog failed:', e.message);
        return [];
      }),
    );
    taskLabels.push('BLOG');
  }

  const results = await Promise.all(tasks);
  const allOutputs = results.flat();

  console.log(
    `[ContentOrchestrator] Dispatched ${taskLabels.join(', ')} | Total outputs: ${allOutputs.length}`,
  );

  return allOutputs;
}
