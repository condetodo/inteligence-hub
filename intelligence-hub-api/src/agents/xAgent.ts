import { callOpus } from '../lib/claude';
import { generateImage } from '../lib/nanoBanana';
import { prisma } from '../lib/prisma';

// --- Types ---

export interface XStandaloneOutput {
  type: 'STANDALONE';
  content: string;
  title: string;
}

export interface XThreadOutput {
  title: string;
  imagePrompt: string;
  tweets: string[];
}

export interface XSkillOutput {
  tweets: XStandaloneOutput[];
  thread: XThreadOutput;
}

// --- Prompts ---

const buildXSystemPrompt = (tweetCount: number, threadCount: number) => `Eres un estratega de contenido experto en X (Twitter) para lideres empresariales hispanohablantes.

TU MISION: Generar exactamente ${tweetCount} tweets independientes y ${threadCount} hilo${threadCount !== 1 ? 's' : ''} de 5-8 tweets, basandote en la voz de marca y el corpus semanal.

REGLAS PARA TWEETS INDEPENDIENTES:
- Maximo 280 caracteres ESTRICTO - esto es innegociable
- Una sola idea por tweet - claridad absoluta
- Formato directo: afirmacion + contexto breve O pregunta provocadora
- Pueden incluir 1-2 hashtags pero NO es obligatorio
- Si incluyen dato o ejemplo, debe ser del corpus real

REGLAS PARA HILOS:
- Tweet 1 (gancho): Debe generar curiosidad. Usa "thread" al final para indicar que es hilo
- Tweets 2-6 (desarrollo): Una idea por tweet, que construya sobre la anterior
- Tweet 7-8 (cierre): Resumen + CTA (seguir, compartir, opinar)
- Cada tweet del hilo debe funcionar de forma independiente si se comparte solo
- Numerar los tweets del hilo: 1/, 2/, 3/...

TONO EN X:
- Mas informal que LinkedIn pero igualmente inteligente
- Permitido ser mas provocador y directo
- Frases cortas, impactantes
- Se puede usar humor sutil si la voz de marca lo permite
- Evitar sonar como "guru" o "coach"

FORMATO DE RESPUESTA (JSON estricto):
{
  "tweets": [
    { "type": "STANDALONE", "content": "texto del tweet (max 280 chars)", "title": "titulo interno descriptivo" },
    { "type": "STANDALONE", "content": "texto del tweet (max 280 chars)", "title": "titulo interno descriptivo" }
  ],
  "thread": {
    "title": "titulo interno del hilo",
    "imagePrompt": "descripcion visual para imagen del primer tweet",
    "tweets": ["1/ texto del primer tweet del hilo", "2/ texto del segundo tweet", "3/ ..."]
  }
}`;

const buildXUserPrompt = (
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  tweetCount: number,
  threadCount: number,
  strategicContext?: string,
) =>
  `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

DOCUMENTOS ESTRATEGICOS:
${strategicContext || 'No hay documentos estrategicos cargados.'}

Genera ${tweetCount} tweets independientes y ${threadCount} hilo${threadCount !== 1 ? 's' : ''} de 5-8 tweets. Responde SOLO con JSON valido.`;

// --- Agent ---

export async function runXAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number; threadsPerPeriod: number },
  benchmark?: string,
  strategicContext?: string,
  configContext?: string,
): Promise<any[]> {
  const tweetCount = config.postsPerPeriod;
  const threadCount = config.threadsPerPeriod;
  console.log(`[XAgent] Generating ${tweetCount} tweets and ${threadCount} threads for instance ${instanceId}, week ${weekNumber}/${year}`);

  // 1. Generate content via LLM
  const systemPrompt = buildXSystemPrompt(tweetCount, threadCount);
  const userPrompt = buildXUserPrompt(brandVoice, corpus, tweetCount, threadCount, strategicContext) + (benchmark || '') + (configContext ? '\n\n' + configContext : '');
  const result = await callOpus(systemPrompt, userPrompt) as unknown as XSkillOutput;

  if (!result?.tweets && !result?.thread) {
    console.error('[XAgent] No content returned from LLM');
    return [];
  }

  // 2. Persist content
  const contentOutputs: any[] = [];

  // 2a. Standalone tweets (no image generation, single variant 'A')
  if (result.tweets) {
    for (const tweet of result.tweets) {
      const output = await prisma.contentOutput.create({
        data: {
          instanceId,
          weekNumber,
          year,
          platform: 'X',
          type: 'POST',
          title: tweet.title,
          content: tweet.content,
          variant: 'A',
          status: 'DRAFT',
        },
      });
      contentOutputs.push(output);
    }
  }

  // 2b. Thread with image generation
  if (result.thread) {
    let imageUrl: string | null = null;
    try {
      const img = await generateImage(result.thread.imagePrompt);
      imageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (e: any) {
      console.error('[XAgent] Image generation failed for X thread:', e.message);
    }

    const output = await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'X',
        type: 'THREAD',
        title: result.thread.title,
        content: result.thread.tweets.join('\n\n'),
        imageUrl,
        imagePrompt: result.thread.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
    contentOutputs.push(output);
  }

  console.log(`[XAgent] Created ${contentOutputs.length} X outputs`);
  return contentOutputs;
}
