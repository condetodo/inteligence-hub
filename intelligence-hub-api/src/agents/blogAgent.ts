import { callOpus } from '../lib/claude';
import { prisma } from '../lib/prisma';
import { logUsage } from '../lib/usageLogger';

// --- Types ---

export interface BlogSection {
  type: string;
  heading?: string;
  content: string;
}

export interface BlogArticle {
  title: string;
  subtitle: string;
  imagePrompt: string;
  sections: BlogSection[];
  seoKeywords: string[];
}

export interface BlogSkillOutput {
  article: BlogArticle;
}

// --- Prompts ---

const buildBlogSystemPrompt = (articleCount: number) => `Eres un escritor experto de articulos de blog para lideres empresariales hispanohablantes. Escribes contenido de alta calidad que posiciona al autor como referente en su sector.

TU MISION: Generar exactamente ${articleCount} articulo${articleCount !== 1 ? 's' : ''} de blog completo${articleCount !== 1 ? 's' : ''} basandote en la voz de marca y el corpus semanal.

ESTRUCTURA DEL ARTICULO:
1. TITULO: Claro, con gancho, orientado a beneficio. 60-70 caracteres max.
2. SUBTITULO: Expande el titulo, genera curiosidad. 1 linea.
3. INTRODUCCION (100-150 palabras): Plantea el problema/contexto. Conecta con el lector.
4. DESARROLLO (3-4 secciones con subtitulos H2, 150-200 palabras cada una): El contenido principal.
5. CONCLUSION (100-150 palabras): Resumen + vision + CTA.

REGLAS:
- Total: 800-1200 palabras
- Tono: experto pero accesible. Usa ejemplos concretos del corpus.
- Parrafos cortos (3-4 lineas max) para lectura web
- Incluir al menos 1 dato o ejemplo real del corpus
- No ser generico - el articulo debe reflejar la experiencia UNICA del autor
- SEO-friendly: incluir keywords naturalmente

FORMATO DE RESPUESTA (JSON estricto):
{
  "article": {
    "title": "titulo del articulo",
    "subtitle": "subtitulo",
    "imagePrompt": "descripcion visual para imagen de portada",
    "sections": [
      { "type": "intro", "content": "texto de la introduccion" },
      { "type": "h2", "heading": "subtitulo de seccion", "content": "texto de la seccion" },
      { "type": "h2", "heading": "subtitulo de seccion", "content": "texto de la seccion" },
      { "type": "h2", "heading": "subtitulo de seccion", "content": "texto de la seccion" },
      { "type": "conclusion", "content": "texto de la conclusion" }
    ],
    "seoKeywords": ["keyword1", "keyword2", "keyword3"]
  }
}`;

const buildBlogUserPrompt = (
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  articleCount: number,
  strategicContext?: string,
  configContext?: string,
  benchmark?: string,
  styleContext?: string,
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

Genera ${articleCount} articulo${articleCount !== 1 ? 's' : ''} de blog completo${articleCount !== 1 ? 's' : ''}. Responde SOLO con JSON valido.`;

// --- Agent ---

export async function runBlogAgent(
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
): Promise<any[]> {
  const articleCount = config.postsPerPeriod;
  console.log(`[BlogAgent] Generating ${articleCount} articles for instance ${instanceId}, week ${weekNumber}/${year}`);

  // 1. Generate content via LLM (blog uses higher maxTokens)
  const systemPrompt = buildBlogSystemPrompt(articleCount);
  const userPrompt = buildBlogUserPrompt(brandVoice, corpus, articleCount, strategicContext, configContext, benchmark, styleContext);
  const { data: result, usage } = await callOpus(systemPrompt, userPrompt, 12000) as unknown as { data: BlogSkillOutput; usage: any };

  if (usage && runId) {
    await logUsage({
      instanceId,
      processingRunId: runId,
      provider: 'anthropic',
      model: usage.model,
      stepName: 'blog',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((e) => console.error('[BlogAgent] Usage logging failed:', e.message));
  }

  if (!result?.article) {
    console.error('[BlogAgent] No article returned from LLM');
    return [];
  }

  // 2. Persist article with image generation
  const contentOutputs: any[] = [];

  const fullContent = result.article.sections
    .map((s: BlogSection) => s.heading ? `## ${s.heading}\n\n${s.content}` : s.content)
    .join('\n\n');

  const output = await prisma.contentOutput.create({
    data: {
      instanceId,
      weekNumber,
      year,
      platform: 'BLOG',
      type: 'ARTICLE',
      title: result.article.title,
      content: fullContent,
      imagePrompt: result.article.imagePrompt,
      variant: 'A',
      status: 'DRAFT',
    },
  });
  contentOutputs.push(output);

  console.log(`[BlogAgent] Created ${contentOutputs.length} blog article`);
  return contentOutputs;
}
