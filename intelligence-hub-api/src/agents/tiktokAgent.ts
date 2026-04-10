import { callOpus } from '../lib/claude';
import { prisma } from '../lib/prisma';
import { logUsage } from '../lib/usageLogger';

// --- Types ---

export interface TikTokScript {
  type: string;
  title: string;
  hook: string;
  script: string;
  duration: string;
  imagePrompt: string;
}

export interface TikTokSkillOutput {
  scripts: TikTokScript[];
}

// --- Prompts ---

const buildTikTokSystemPrompt = (scriptCount: number) => `Eres un estratega de contenido experto en TikTok/Reels para lideres empresariales hispanohablantes que quieren construir marca personal con video corto.

TU MISION: Generar exactamente ${scriptCount} guiones de video corto (60-90 segundos) basandote en la voz de marca y el corpus semanal.

ESTRUCTURA DE CADA GUION:
1. HOOK (primeros 3 segundos): La frase que aparece en pantalla y se dice al inicio. CRUCIAL para retener.
2. DESARROLLO (40-60 segundos): El contenido principal dividido en bloques claros.
3. CTA (ultimos 10 segundos): Cierre con llamada a la accion.

REGLAS:
- Cada guion debe incluir indicaciones de camara/encuadre basicas
- Tono conversacional como si hablaras con un amigo inteligente
- No usar lenguaje de "vendedor" - educar > vender
- Incluir momentos de "pattern interrupt" (cambio de ritmo, pregunta retorica)
- Los guiones deben ser ejecutables por una persona sola con celular

TIPOS DE VIDEO (distribuir):
1. TAKE CALIENTE: Opinion fuerte sobre algo del sector. "Unpopular opinion: ..."
2. MINI-TUTORIAL: "Como hacer X en 3 pasos" o "El truco que nadie te ensena"

FORMATO DE RESPUESTA (JSON estricto):
{
  "scripts": [
    {
      "type": "HOT_TAKE" | "MINI_TUTORIAL",
      "title": "titulo interno",
      "hook": "frase de gancho (primeros 3 seg)",
      "script": "guion completo con indicaciones de camara entre [corchetes]",
      "duration": "60s" | "90s",
      "imagePrompt": "descripcion de thumbnail para el video"
    }
  ]
}`;

const buildTikTokUserPrompt = (
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  scriptCount: number,
  strategicContext?: string,
  configContext?: string,
  benchmark?: string,
  styleContext?: string,
  humanizationContext?: string,
) =>
  `BRAND VOICE (identidad fija):
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL:
${JSON.stringify(corpus, null, 2)}

DOCUMENTOS ESTRATEGICOS:
${strategicContext || 'No hay documentos estrategicos cargados.'}

${configContext || ''}

${benchmark || ''}

${styleContext || ''}

${humanizationContext || ''}

Genera ${scriptCount} guiones de video corto para TikTok/Reels. Responde SOLO con JSON valido.`;

// --- Agent ---

export async function runTikTokAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number },
  benchmark?: string,
  strategicContext?: string,
  configContext?: string,
  styleContext?: string,
  runId?: string,
  humanizationContext?: string,
): Promise<any[]> {
  const scriptCount = config.postsPerPeriod;
  console.log(`[TikTokAgent] Generating ${scriptCount} scripts for instance ${instanceId}, week ${weekNumber}/${year}`);

  // 1. Generate content via LLM
  const systemPrompt = buildTikTokSystemPrompt(scriptCount);
  const userPrompt = buildTikTokUserPrompt(brandVoice, corpus, scriptCount, strategicContext, configContext, benchmark, styleContext, humanizationContext);
  const { data: result, usage } = await callOpus(systemPrompt, userPrompt) as unknown as { data: TikTokSkillOutput; usage: any };

  if (usage && runId) {
    await logUsage({
      instanceId,
      processingRunId: runId,
      provider: 'anthropic',
      model: usage.model,
      stepName: 'tiktok',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((e) => console.error('[TikTokAgent] Usage logging failed:', e.message));
  }

  if (!result?.scripts) {
    console.error('[TikTokAgent] No scripts returned from LLM');
    return [];
  }

  // 2. Persist scripts (no image generation — only store imagePrompt for thumbnails)
  const contentOutputs: any[] = [];

  for (const script of result.scripts) {
    const output = await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'TIKTOK',
        type: 'SCRIPT',
        title: script.title,
        content: script.script,
        imagePrompt: script.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
    contentOutputs.push(output);
  }

  console.log(`[TikTokAgent] Created ${contentOutputs.length} TikTok scripts`);
  return contentOutputs;
}
