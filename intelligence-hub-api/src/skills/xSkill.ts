import { callOpus } from '../lib/claude';

const X_SYSTEM_PROMPT = `Eres un estratega de contenido experto en X (Twitter) para lideres empresariales hispanohablantes.

TU MISION: Generar exactamente 2 tweets independientes y 1 hilo de 5-8 tweets, basandote en la voz de marca y el corpus semanal.

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

export async function generateX(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>
): Promise<XSkillOutput> {
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera 2 tweets independientes y 1 hilo de 5-8 tweets. Responde SOLO con JSON valido.`;

  const result = await callOpus(X_SYSTEM_PROMPT, userPrompt);
  return result as unknown as XSkillOutput;
}
