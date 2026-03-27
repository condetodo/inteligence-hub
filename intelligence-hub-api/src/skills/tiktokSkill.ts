import { callOpus } from '../lib/claude';

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

const buildTikTokUserPrompt = (brandVoice: Record<string, unknown>, corpus: Record<string, unknown>, scriptCount: number) =>
  `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera ${scriptCount} guiones de video corto para TikTok/Reels. Responde SOLO con JSON valido.`;

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

export async function generateTikTok(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  scriptCount: number = 2
): Promise<TikTokSkillOutput> {
  const systemPrompt = buildTikTokSystemPrompt(scriptCount);
  const userPrompt = buildTikTokUserPrompt(brandVoice, corpus, scriptCount);

  const result = await callOpus(systemPrompt, userPrompt);
  return result as unknown as TikTokSkillOutput;
}
