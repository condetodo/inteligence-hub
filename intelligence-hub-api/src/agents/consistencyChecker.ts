import { callSonnet } from '../lib/claude';
import { prisma } from '../lib/prisma';
import { logUsage } from '../lib/usageLogger';

const CONSISTENCY_SYSTEM_PROMPT = `
Eres un analista de consistencia de marca. Tu trabajo es evaluar si el contenido generado
es consistente con la identidad de marca (Brand Voice) definida.

Evaluás:
1. TONO: ¿El contenido respeta el tono definido? (adjetivos, anti-patrones)
2. AUDIENCIA: ¿Está dirigido a la audiencia correcta?
3. POSICIONAMIENTO: ¿Refleja el posicionamiento definido?
4. IDENTIDAD: ¿Es coherente con la identidad del cliente?
5. DIVERSIDAD: ¿Es suficientemente diferente de los posts recientes aprobados?

FORMATO DE RESPUESTA (JSON estricto):
{
  "scores": [
    {
      "contentId": "id",
      "score": 8.5,
      "notes": "Buen tono pero podría ser más directo. El hook es genérico."
    }
  ]
}
`;

export async function runConsistencyChecker(instanceId: string, weekNumber: number, year: number, runId?: string) {
  console.log(`[ConsistencyChecker] Starting for instance ${instanceId}, period ${weekNumber}/${year}`);

  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  if (!brandVoice) {
    console.log('[ConsistencyChecker] No brand voice found, skipping.');
    return;
  }

  const drafts = await prisma.contentOutput.findMany({
    where: { instanceId, weekNumber, year, status: 'DRAFT' },
  });
  if (!drafts.length) {
    console.log('[ConsistencyChecker] No drafts to evaluate, skipping.');
    return;
  }

  const recentApproved = await prisma.contentOutput.findMany({
    where: { instanceId, status: { in: ['APPROVED', 'PUBLISHED'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const userPrompt = `
BRAND VOICE (Identidad estática):
- Identidad: ${brandVoice.identity}
- Propuesta de valor: ${brandVoice.valueProposition}
- Audiencia: ${brandVoice.audience}
- Tono: ${JSON.stringify(brandVoice.voiceTone)}
- Posicionamiento: ${brandVoice.positioning}

CONTENIDO A EVALUAR:
${drafts.map((d) => `[ID: ${d.id}] [${d.platform} - ${d.variant}]:\n${d.content}`).join('\n\n')}

POSTS RECIENTES APROBADOS (para check de diversidad):
${recentApproved.map((a) => a.content.substring(0, 200)).join('\n---\n')}
`;

  const { data: result, usage } = await callSonnet(CONSISTENCY_SYSTEM_PROMPT, userPrompt, 4096);

  if (usage && runId) {
    await logUsage({
      instanceId,
      processingRunId: runId,
      provider: 'anthropic',
      model: usage.model,
      stepName: 'consistency',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((e) => console.error('[ConsistencyChecker] Usage logging failed:', e.message));
  }

  const scores = result?.scores as Array<{ contentId: string; score: number; notes: string }> | undefined;
  if (scores) {
    for (const score of scores) {
      await prisma.contentOutput.update({
        where: { id: score.contentId },
        data: {
          consistencyScore: score.score,
          consistencyNotes: score.notes,
        },
      });
    }
    console.log(`[ConsistencyChecker] Scored ${scores.length} drafts.`);
  } else {
    console.warn('[ConsistencyChecker] No scores returned from Claude.');
  }
}
