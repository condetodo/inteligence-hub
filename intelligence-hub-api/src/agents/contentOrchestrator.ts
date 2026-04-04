import { Platform } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runLinkedInAgent } from './linkedinAgent';
import { runXAgent } from './xAgent';
import { runTikTokAgent } from './tiktokAgent';
import { runBlogAgent } from './blogAgent';

// --- Benchmark helpers ---

async function loadBenchmarkPosts(instanceId: string, platform: Platform, limit: number = 3) {
  const approved = await prisma.contentOutput.findMany({
    where: {
      instanceId,
      platform,
      status: { in: ['APPROVED', 'PUBLISHED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 3,
  });
  return selectDiverseSubset(approved, limit);
}

function selectDiverseSubset(posts: any[], limit: number) {
  if (posts.length <= limit) return posts;
  const step = Math.floor(posts.length / limit);
  return Array.from({ length: limit }, (_, i) => posts[i * step]);
}

function formatBenchmark(posts: any[]) {
  if (!posts.length) return '';
  return `
CONTENIDO APROBADO DE REFERENCIA (benchmark):
Estos posts fueron aprobados por el equipo. Observa el nivel de calidad, profundidad y tono.
NO copies la estructura ni el contenido. Varia activamente. Tu objetivo es SUPERAR estos ejemplos.

${posts.map((p, i) => `--- Ejemplo ${i + 1} ---
${p.content}
${p.approvalNotes ? `Notas del equipo: ${p.approvalNotes}` : ''}
---`).join('\n')}
`;
}

export function formatAgentConfig(config: any) {
  if (!config) return '';
  const sliders = config.styleSliders || {};
  const formalLabel =
    sliders.formal > 0.6 ? 'formal' : sliders.formal < 0.4 ? 'conversacional' : 'equilibrado';
  const techLabel =
    sliders.technical > 0.6 ? 'técnico' : sliders.technical < 0.4 ? 'accesible' : 'equilibrado';
  const lengthLabel =
    sliders.concise > 0.6 ? 'conciso' : sliders.concise < 0.4 ? 'detallado' : 'medio';

  return `
DIRECTRICES DE ESTILO (configuradas por el equipo):
- Tono: ${formalLabel}, Nivel técnico: ${techLabel}, Extensión: ${lengthLabel}
${config.styleInstructions ? `- Instrucciones: ${config.styleInstructions}` : ''}
${config.referenceExamples ? `- Ejemplos de referencia del equipo:\n${config.referenceExamples}` : ''}
${config.restrictions?.length ? `- Restricciones: ${config.restrictions.join('. ')}` : ''}
`;
}

export interface ProcessingModalConfig {
  contentTypes: string[];
  milestone?: { description: string; tone: string };
  directives?: string;
  platforms?: string[];
}

function buildProcessingConfigContext(config: ProcessingModalConfig): string {
  const lines = [
    'CONFIGURACIÓN DE ESTA GENERACIÓN:',
    `- Tipos de contenido: ${config.contentTypes.join(', ')}`,
  ];
  if (config.milestone) {
    lines.push(`- HITO: ${config.milestone.description} (tono: ${config.milestone.tone})`);
  }
  if (config.directives) {
    lines.push(`- Directivas: ${config.directives}`);
  }
  return lines.join('\n');
}

export async function runContentOrchestrator(
  instanceId: string,
  weekNumber: number,
  year: number,
  processingConfig?: ProcessingModalConfig,
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

  // ── Load foundational / strategic documents ───────────────────────
  const foundationalDocs = await prisma.inputFile.findMany({
    where: { instanceId, isFoundational: true },
    select: { label: true, extractedSummary: true, type: true },
  });

  const strategicContext = foundationalDocs
    .filter((d) => d.extractedSummary)
    .map((d, i) => `${i + 1}. [${d.label || d.type}]: ${d.extractedSummary}`)
    .join('\n');

  if (foundationalDocs.length > 0) {
    console.log(
      `[ContentOrchestrator] Loaded ${foundationalDocs.length} foundational doc(s), ${foundationalDocs.filter((d) => d.extractedSummary).length} with summaries`,
    );
  }

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

  // ── Clean up old drafts before generating new ones ─────────────────
  // Only DRAFT content is removed. REVIEW, APPROVED, and PUBLISHED are preserved.
  const deleted = await prisma.contentOutput.deleteMany({
    where: { instanceId, weekNumber, year, status: 'DRAFT' },
  });
  if (deleted.count > 0) {
    console.log(`[ContentOrchestrator] Removed ${deleted.count} old draft(s) for week ${weekNumber}/${year}`);
  }

  // ── Apply processing modal config: filter platforms if specified ─────
  if (processingConfig?.platforms?.length) {
    const allowedPlatforms = processingConfig.platforms.map((p) => p.toUpperCase());
    platformConfigs = platformConfigs.filter((c) =>
      allowedPlatforms.includes(c.platform.toUpperCase()),
    );
    console.log(`[ContentOrchestrator] Filtered platforms to: ${allowedPlatforms.join(', ')}`);
  }

  const configContext = processingConfig
    ? buildProcessingConfigContext(processingConfig)
    : '';

  // ── Load benchmarks per platform ────────────────────────────────────

  const enabledPlatforms = platformConfigs.filter((c) => c.enabled).map((c) => c.platform);
  const benchmarksByPlatform: Record<string, string> = {};
  for (const platform of enabledPlatforms) {
    const benchmarkPosts = await loadBenchmarkPosts(instanceId, platform);
    benchmarksByPlatform[platform] = formatBenchmark(benchmarkPosts);
    if (benchmarkPosts.length > 0) {
      console.log(`[ContentOrchestrator] Loaded ${benchmarkPosts.length} benchmark posts for ${platform}`);
    }
  }

  // ── Load agent style configs per platform ─────────────────────────
  const styleByPlatform: Record<string, string> = {};
  for (const platform of enabledPlatforms) {
    const agentConfig = await prisma.agentPromptConfig.findUnique({
      where: { instanceId_platform: { instanceId, platform } },
    });
    styleByPlatform[platform] = formatAgentConfig(agentConfig);
    if (agentConfig) {
      console.log(`[ContentOrchestrator] Loaded agent style config for ${platform}`);
    }
  }

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
      }, benchmarksByPlatform['LINKEDIN'], strategicContext, configContext || undefined, styleByPlatform['LINKEDIN'] || undefined).catch((e) => {
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
      }, benchmarksByPlatform['X'], strategicContext, configContext || undefined, styleByPlatform['X'] || undefined).catch((e) => {
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
      }, benchmarksByPlatform['TIKTOK'], strategicContext, configContext || undefined, styleByPlatform['TIKTOK'] || undefined).catch((e) => {
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
      }, benchmarksByPlatform['BLOG'], strategicContext, configContext || undefined, styleByPlatform['BLOG'] || undefined).catch((e) => {
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
