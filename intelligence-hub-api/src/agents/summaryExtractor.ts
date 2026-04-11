import { callSonnet, STRICT_JSON_DIRECTIVE, MAX_TOKENS } from '../lib/claude';
import { prisma } from '../lib/prisma';
import { logUsage } from '../lib/usageLogger';

/**
 * Destills a single foundational/strategic document into a compact summary
 * that gets persisted in InputFile.extractedSummary. The content agents and
 * insights agent consume this summary (not the full raw content) as context
 * in every run.
 *
 * Why a dedicated agent:
 * - A brief of 20 pages is ~12k tokens. Passing the full text to every agent
 *   in every run is wasteful (cost + latency + noise).
 * - Destilling once at upload time means the downstream agents always see
 *   a focused 300-400 word version that emphasises what matters for content
 *   generation: the doc's purpose, the key facts, and the communicational
 *   implications.
 *
 * Model: Sonnet (mechanical extraction from a single well-structured source,
 * doesn't need Opus reasoning).
 */

const SUMMARY_SYSTEM_PROMPT = `Eres un analista estrategico experto en comunicacion corporativa. Tu trabajo es destilar documentos fundacionales (briefs de marca, analisis de mercado, planes de comunicacion, manuales de voz, etc.) en resumenes compactos y accionables.

El resumen que generes se usara como contexto permanente en cada generacion de contenido. Tiene que ser util para agentes que escriben posts, articulos y guiones, NO para agentes que toman decisiones de negocio.

REGLAS:
- Extension total objetivo: 300-400 palabras
- Enfoque: implicaciones COMUNICACIONALES, no ejecutivas
- Mantener TODOS los datos concretos relevantes (cifras, nombres, posicionamientos, prioridades)
- NO inventar informacion que no esta en el documento
- Si el documento tiene contradicciones, mencionarlas
- Si hay lenguaje prohibido o preferido explicitamente, listarlo
- Usar espanol neutro, sin tecnicismos innecesarios

FORMATO DE RESPUESTA (JSON estricto):
{
  "docType": "brief de marca | plan de comunicacion | analisis de mercado | manual de voz | otro",
  "purpose": "para que existe este documento en una o dos oraciones",
  "keyPoints": [
    "punto clave 1 con dato concreto",
    "punto clave 2 con dato concreto",
    "..."
  ],
  "communicationalImplications": "3-5 oraciones sobre como este documento debe reflejarse en el contenido generado. Ejemplo: 'La marca debe posicionarse como experta en X, evitar mencionar Y, priorizar temas de Z'"
}

${STRICT_JSON_DIRECTIVE}`;

interface SummaryOutput {
  docType: string;
  purpose: string;
  keyPoints: string[];
  communicationalImplications: string;
}

/**
 * Runs the extractor against the raw content of a foundational doc and
 * persists the result in extractedSummary. Returns the updated InputFile.
 *
 * Idempotent: calling twice on the same doc just regenerates the summary.
 *
 * Does NOT throw on LLM errors — logs and returns null so the upload
 * endpoint can still succeed even if extraction fails transiently.
 */
export async function runSummaryExtractor(inputId: string): Promise<string | null> {
  const input = await prisma.inputFile.findUnique({ where: { id: inputId } });
  if (!input) {
    console.warn(`[SummaryExtractor] Input ${inputId} not found`);
    return null;
  }
  if (!input.isFoundational) {
    console.warn(`[SummaryExtractor] Input ${inputId} is not foundational, skipping`);
    return null;
  }

  const label = input.label || input.filename || 'documento sin etiqueta';
  console.log(`[SummaryExtractor] Extracting summary for "${label}" (${input.content.length} chars)`);

  const userPrompt = `Destila el siguiente documento fundacional en un resumen estructurado segun el formato especificado.

ETIQUETA: ${label}
TIPO DECLARADO: ${input.type}

CONTENIDO COMPLETO:
${input.content}`;

  try {
    const { data, usage } = await callSonnet(
      SUMMARY_SYSTEM_PROMPT,
      userPrompt,
      MAX_TOKENS.summaryExtractor,
    );

    const result = data as unknown as SummaryOutput;
    if (!result?.purpose || !Array.isArray(result?.keyPoints)) {
      console.error(`[SummaryExtractor] Invalid response shape for ${inputId}`);
      return null;
    }

    // Format the final summary as a compact string for easy injection into prompts
    const formatted = [
      `Tipo: ${result.docType || 'documento estrategico'}`,
      `Proposito: ${result.purpose}`,
      `Puntos clave:`,
      ...result.keyPoints.map((p) => `  - ${p}`),
      `Implicaciones comunicacionales: ${result.communicationalImplications}`,
    ].join('\n');

    await prisma.inputFile.update({
      where: { id: inputId },
      data: { extractedSummary: formatted },
    });

    // Best-effort usage logging
    if (usage) {
      await logUsage({
        instanceId: input.instanceId,
        provider: 'anthropic',
        model: usage.model,
        stepName: 'summary_extractor',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      }).catch((e) => console.error('[SummaryExtractor] Usage logging failed:', e.message));
    }

    console.log(`[SummaryExtractor] Saved ${formatted.length} chars of summary for "${label}"`);
    return formatted;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[SummaryExtractor] Failed for ${inputId}: ${msg}`);
    return null;
  }
}
