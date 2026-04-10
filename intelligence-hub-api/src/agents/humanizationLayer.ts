// Humanization Layer
// Cross-cutting directives that remove typical AI writing patterns from generated content.
// Applied universally to all agents, with per-platform adjustments.
//
// This layer is independent from:
// - Brand Voice anti-patterns (communicational, per instance)
// - Agent personality config (style sliders, user instructions)
//
// See: docs/superpowers/specs/2026-04-09-humanization-layer-design.md

type SupportedPlatform = 'LINKEDIN' | 'X' | 'BLOG' | 'TIKTOK';

const BASE_RULES = `REGLAS DE ESCRITURA NATURAL (obligatorias):

1. RITMO DE ORACIONES: Varia la longitud. Mezcla frases de 5 palabras con otras de 25. El ritmo monotono delata a la IA. Si tres oraciones seguidas tienen largo similar, reescribe una.

2. PRIMERA PERSONA: Cuando el autor opina, escribe en primera persona ("yo creo", "a mi me paso", "lo que vi fue..."). La voz pasiva e impersonal ("se debe considerar", "es necesario") es un patron AI. Usala solo cuando describes hechos, no opiniones.

3. PALABRAS PROHIBIDAS (comodines de IA): PROHIBIDO usar las siguientes expresiones bajo ninguna circunstancia:
   - "en el mundo actual"
   - "es importante destacar"
   - "cabe mencionar"
   - "en este sentido"
   - "sin lugar a dudas"
   - "en conclusion"
   - "hoy en dia"
   - "en la actualidad"
   Si necesitas transicion, usa conectores concretos o simplemente empieza una nueva oracion.

4. VOCABULARIO PROHIBIDO (generico corporativo): PROHIBIDO:
   - "ademas", "asimismo", "por otro lado" -> usa punto y aparte
   - "potenciar", "transformar", "revolucionar", "impulsar" -> usa verbos concretos ("reducir X a la mitad", "subir de 10 a 40")
   - "sin precedentes", "paradigma", "sinergia", "holistico" -> no tienen equivalente, eliminalos
   Cada palabra prohibida tiene alternativa: verbo de accion concreta o dato especifico.

5. ESTRUCTURA NO LINEAL: NUNCA uses "Primero/Segundo/Tercero" como esqueleto visible. NUNCA uses Contexto-Problema-Solucion como esquema predecible. Rompe el orden: empieza por la conclusion, por una anecdota, por un dato suelto, por una pregunta. El lector debe sentir que tu pensamiento fluye, no que sigue un template.

6. ECONOMIA DE PALABRAS: Si una oracion no agrega informacion nueva, eliminarla. Menos palabras = mas impacto. No repitas la misma idea con distintas palabras. Revisa: cada parrafo debe sobrevivir la pregunta "¿que se perderia si borro esto?".

7. IMPERFECCIONES DELIBERADAS: Incluye matices humanos: una digresion breve, una duda expresada ("no se si esto aplica para todos, pero..."), un cambio de opinion, una auto-correccion ("o mejor dicho..."). Las personas reales no tienen todo resuelto.

8. CONCRECION: Se especifico siempre. En vez de "mejorar los procesos", escribe "reducir el tiempo de respuesta de 48h a 12h". Si no hay dato exacto en el corpus, usa uno verosimil del contexto (nunca inventes cifras que suenen falsas). Prefiere nombres, lugares, fechas, numeros.`;

const LINKEDIN_OVERRIDES = `
AJUSTES PARA LINKEDIN:
- Aplica TODAS las reglas base.
- PROHIBIDO especialmente: posts motivacionales genericos, storytelling forzado con "moraleja", listas de "5 lecciones que aprendi", frases inspiracionales vacias.
- Refuerza primera persona: un post en LinkedIn sin "yo" casi siempre suena a IA.
- Refuerza concrecion: los numeros reales (facturacion, tiempos, cantidades del corpus) son el diferencial.`;

const X_OVERRIDES = `
AJUSTES PARA X (Twitter):
- El limite de 280 chars exige concision natural; la regla de "ritmo variado" NO aplica (son frases sueltas, no prosa).
- Refuerza: vocabulario prohibido, primera persona, concrecion.
- Permitido: frases cortas e impactantes, elipsis, fragmentos sin verbo. Es el formato nativo de X.
- NO abuses de hashtags. Si el tweet necesita un hashtag para funcionar, no es un buen tweet.`;

const BLOG_OVERRIDES = `
AJUSTES PARA BLOG:
- Aplica TODAS las reglas con maxima intensidad. El blog es donde mas se nota la escritura AI.
- Refuerza especialmente: estructura no lineal (NO uses "intro-desarrollo-conclusion" como esqueleto visible aunque la estructura formal lo pida; disimulalo), economia de palabras (un articulo de 1000 palabras casi siempre tiene 300 de relleno; eliminalas), imperfecciones deliberadas.
- El articulo debe tener personalidad y ritmo propio, no sonar a Wikipedia ni a reporte corporativo.
- Empezar por una afirmacion fuerte, una anecdota, o un dato especifico. NUNCA empezar con "En un mundo donde...".`;

const TIKTOK_OVERRIDES = `
AJUSTES PARA TIKTOK (guion hablado):
- RELAJA la regla de ritmo de oraciones: en habla oral, las frases cortas concatenadas SI son naturales.
- Refuerza: naturalidad oral, muletillas reales del habla ("mira", "te cuento", "ojo con esto", "fijate esto", "pero esperate").
- El guion debe sonar como alguien hablando en persona, NO como alguien leyendo un texto.
- Contracciones y pausas: usa "pa'" en vez de "para" si el tono lo permite, incluye pausas marcadas.
- PROHIBIDO: introducciones formales del tipo "Hola, en el video de hoy voy a contarte sobre...". Entra directo al tema en la primera palabra.`;

/**
 * Returns humanization directives tailored to the given platform.
 * This block is injected into each agent's user prompt right after
 * styleContext and before the final generation instruction.
 */
export function getHumanizationDirectives(platform: SupportedPlatform | string): string {
  const normalized = platform.toUpperCase();
  let overrides = '';
  switch (normalized) {
    case 'LINKEDIN':
      overrides = LINKEDIN_OVERRIDES;
      break;
    case 'X':
    case 'TWITTER':
      overrides = X_OVERRIDES;
      break;
    case 'BLOG':
      overrides = BLOG_OVERRIDES;
      break;
    case 'TIKTOK':
      overrides = TIKTOK_OVERRIDES;
      break;
    default:
      overrides = '';
  }
  return `${BASE_RULES}\n${overrides}`.trim();
}
