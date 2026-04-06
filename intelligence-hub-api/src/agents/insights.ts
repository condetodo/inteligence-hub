import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';
import { logUsage } from '../lib/usageLogger';

const INSIGHTS_SYSTEM_PROMPT = `Eres un analista de inteligencia de negocios experto. Generas reportes semanales profundos y accionables para lideres empresariales.

Tu trabajo es analizar el corpus semanal y la voz de marca para generar un reporte de inteligencia que:
1. Identifique patrones y tendencias
2. Conecte puntos entre diferentes conversaciones/temas
3. Sugiera oportunidades accionables
4. Anticipe riesgos potenciales

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": "Resumen ejecutivo de 3-5 oraciones. Directo, sin relleno.",
  "topTopics": [
    {
      "topic": "nombre del tema",
      "analysis": "analisis de por que es relevante esta semana",
      "trend": "rising|stable|declining",
      "actionItem": "que deberia hacer el cliente con esto"
    }
  ],
  "opportunity": "La oportunidad mas grande identificada esta semana, con contexto y siguiente paso concreto.",
  "evolution": "Como evoluciono el posicionamiento/marca esta semana vs la anterior. Que se reforzo, que cambio.",
  "questions": [
    "Pregunta estrategica 1 que el cliente deberia hacerse",
    "Pregunta estrategica 2",
    "Pregunta estrategica 3"
  ],
  "recommendations": "3-5 recomendaciones concretas y accionables para la proxima semana."
}`;

export async function runInsightsAgent(instanceId: string, weekNumber: number, year: number, runId?: string) {
  console.log(`[InsightsAgent] Generating insights for instance ${instanceId}, week ${weekNumber}/${year}`);

  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });

  if (!brandVoice || !corpus) {
    console.log('[InsightsAgent] Missing brand voice or corpus, skipping');
    return null;
  }

  // Get active memory (last N periods)
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  const activeWindow = (instance as any)?.activeWindow ?? 8;
  const recentCorpuses = await prisma.weeklyCorpus.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
    take: activeWindow,
  });

  const userPrompt = `PERFIL BASE (DIGITAL TWIN):
${JSON.stringify({
    identity: brandVoice.identity,
    positioning: brandVoice.positioning,
    recurringTopics: brandVoice.recurringTopics,
    topics: (brandVoice as any).topics || [],
    narratives: (brandVoice as any).narratives || [],
    insightHistory: (brandVoice.insightHistory as any[])?.slice(-4) ?? [],
  }, null, 2)}

CORPUS ACTUAL:
${JSON.stringify({
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  }, null, 2)}

MEMORIA ACTIVA (ultimos ${recentCorpuses.length} periodos):
${JSON.stringify(recentCorpuses.map((c) => ({
    period: c.weekNumber, year: c.year,
    summary: c.summary, topics: c.topics,
  })), null, 2)}

Genera el reporte de inteligencia. Usa la memoria activa para detectar tendencias y cambios.`;

  const { data: result, usage } = await callOpus(INSIGHTS_SYSTEM_PROMPT, userPrompt);

  if (usage && runId) {
    await logUsage({
      instanceId,
      processingRunId: runId,
      provider: 'anthropic',
      model: usage.model,
      stepName: 'insights',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((e) => console.error('[InsightsAgent] Usage logging failed:', e.message));
  }

  // Save insight report
  const report = await prisma.insightReport.upsert({
    where: {
      instanceId_weekNumber_year: { instanceId, weekNumber, year },
    },
    update: {
      executiveSummary: (result.executiveSummary as string) ?? '',
      topTopics: (result.topTopics as any) ?? [],
      opportunity: (result.opportunity as string) ?? '',
      evolution: (result.evolution as string) ?? '',
      questions: (result.questions as any) ?? [],
      recommendations: (result.recommendations as string) ?? '',
    },
    create: {
      instanceId, weekNumber, year,
      executiveSummary: (result.executiveSummary as string) ?? '',
      topTopics: (result.topTopics as any) ?? [],
      opportunity: (result.opportunity as string) ?? '',
      evolution: (result.evolution as string) ?? '',
      questions: (result.questions as any) ?? [],
      recommendations: (result.recommendations as string) ?? '',
    },
  });

  console.log(`[InsightsAgent] Created insight report with ${(result.topTopics as any[])?.length ?? 0} top topics`);
  return report;
}
