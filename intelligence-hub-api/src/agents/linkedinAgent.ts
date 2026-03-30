import { callOpus } from '../lib/claude';
import { generateImage } from '../lib/nanoBanana';
import { prisma } from '../lib/prisma';

// --- Types ---

export interface LinkedInPost {
  type: string;
  title: string;
  imagePrompt: string;
  variants: {
    A: { content: string; hook: string };
    B: { content: string; hook: string };
    C: { content: string; hook: string };
  };
}

export interface LinkedInSkillOutput {
  posts: LinkedInPost[];
}

// --- Prompts ---

const buildLinkedInSystemPrompt = (postCount: number) => `Eres un estratega de contenido experto en LinkedIn para lideres empresariales hispanohablantes.

TU MISION: Generar exactamente ${postCount} publicaciones de LinkedIn, cada una con 3 variantes (A, B, C), basandote en la voz de marca y el corpus semanal proporcionados.

REGLAS DE FORMATO PARA LINKEDIN:
- Cada post debe tener entre 150-250 palabras
- Estructura obligatoria: gancho inicial (1-2 lineas impactantes) -> desarrollo en 3-5 parrafos cortos -> llamada a la accion -> 3 hashtags relevantes
- Parrafos cortos: maximo 2-3 lineas cada uno
- Usar saltos de linea entre parrafos (esto es CRUCIAL en LinkedIn)
- NO usar bullet points excesivos - LinkedIn premia la narrativa fluida
- Incluir una pregunta reflexiva al final para generar comentarios

TIPOS DE POST (distribuir entre los ${postCount}):
1. THOUGHT LEADERSHIP: Opinion fuerte sobre tendencia del sector. Empieza con una afirmacion provocadora.
2. CASO / APRENDIZAJE: Historia real (del corpus) con leccion aplicable. Usa "La semana pasada..." o "Recientemente..."
3. FRAMEWORK / METODO: Comparte un proceso o metodologia. Usa numeros: "3 pasos para...", "El error #1 que veo..."

TONO Y VOZ:
- Mantener EXACTAMENTE el tono descrito en la voz de marca
- Ser directo, no condescendiente
- Evitar cliches de LinkedIn: "Estoy emocionado de anunciar...", "No creeras lo que paso..."
- No usar emojis excesivos (maximo 1-2 por post, solo si la voz de marca lo permite)
- Evitar jerga vacia: "sinergia", "paradigma", "disrumpir" - usar lenguaje concreto
- El contenido debe sonar como si lo escribiera la persona, NO como IA

FORMATO DE RESPUESTA (JSON estricto):
{
  "posts": [
    {
      "type": "THOUGHT_LEADERSHIP" | "CASE_STUDY" | "FRAMEWORK",
      "title": "titulo interno descriptivo (no se publica)",
      "imagePrompt": "descripcion visual para generacion de imagen",
      "variants": {
        "A": { "content": "texto completo del post variante A", "hook": "primera linea del post" },
        "B": { "content": "texto completo del post variante B (mismo tema, diferente angulo)", "hook": "primera linea del post" },
        "C": { "content": "texto completo del post variante C (mismo tema, tono diferente)", "hook": "primera linea del post" }
      }
    }
  ]
}`;

const buildLinkedInUserPrompt = (
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  postCount: number,
) =>
  `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera ${postCount} publicaciones de LinkedIn con 3 variantes cada una. Responde SOLO con JSON valido.`;

// --- Agent ---

export async function runLinkedInAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number },
): Promise<any[]> {
  const postCount = config.postsPerPeriod;
  console.log(`[LinkedInAgent] Generating ${postCount} posts for instance ${instanceId}, week ${weekNumber}/${year}`);

  // 1. Generate content via LLM
  const systemPrompt = buildLinkedInSystemPrompt(postCount);
  const userPrompt = buildLinkedInUserPrompt(brandVoice, corpus, postCount);
  const result = await callOpus(systemPrompt, userPrompt) as unknown as LinkedInSkillOutput;

  if (!result?.posts) {
    console.error('[LinkedInAgent] No posts returned from LLM');
    return [];
  }

  // 2. Persist posts with image generation
  const contentOutputs: any[] = [];

  for (const post of result.posts) {
    for (const variant of ['A', 'B', 'C'] as const) {
      const v = post.variants[variant];
      if (!v) continue;

      let imageUrl: string | null = null;
      try {
        const img = await generateImage(post.imagePrompt);
        imageUrl = `data:${img.mimeType};base64,${img.base64}`;
      } catch (e: any) {
        console.error('[LinkedInAgent] Image generation failed:', e.message);
      }

      const output = await prisma.contentOutput.create({
        data: {
          instanceId,
          weekNumber,
          year,
          platform: 'LINKEDIN',
          type: 'POST',
          title: post.title,
          content: v.content,
          imageUrl,
          imagePrompt: post.imagePrompt,
          variant,
          status: 'DRAFT',
        },
      });
      contentOutputs.push(output);
    }
  }

  console.log(`[LinkedInAgent] Created ${contentOutputs.length} LinkedIn variants`);
  return contentOutputs;
}
