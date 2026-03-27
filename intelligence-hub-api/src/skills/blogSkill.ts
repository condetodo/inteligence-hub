import { callOpus } from '../lib/claude';

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

const buildBlogUserPrompt = (brandVoice: Record<string, unknown>, corpus: Record<string, unknown>, articleCount: number) =>
  `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera ${articleCount} articulo${articleCount !== 1 ? 's' : ''} de blog completo${articleCount !== 1 ? 's' : ''}. Responde SOLO con JSON valido.`;

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

export async function generateBlog(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  articleCount: number = 1
): Promise<BlogSkillOutput> {
  const systemPrompt = buildBlogSystemPrompt(articleCount);
  const userPrompt = buildBlogUserPrompt(brandVoice, corpus, articleCount);

  const result = await callOpus(systemPrompt, userPrompt, 12000);
  return result as unknown as BlogSkillOutput;
}
