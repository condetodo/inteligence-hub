import { prisma } from '../lib/prisma';
import { callSonnet } from '../lib/claude';

const CORPUS_SYSTEM_PROMPT = `Eres un analista de comunicaciones experto. Tu trabajo es procesar conversaciones, emails y notas en bruto y extraer informacion estructurada.

Analiza TODOS los inputs proporcionados y extrae:

1. SUMMARY: Resumen ejecutivo de la semana (3-5 oraciones)
2. TOPICS: Lista de temas principales discutidos (con relevancia 1-10)
3. DECISIONS: Decisiones tomadas o compromisos adquiridos
4. CONCERNS: Preocupaciones, problemas o riesgos mencionados
5. OPPORTUNITIES: Oportunidades de negocio o crecimiento identificadas

REGLAS:
- Extraer SOLO lo que esta en los inputs, no inventar
- Distinguir entre conversaciones de negocio y personales (marcar como tal)
- Identificar nombres de personas y empresas mencionadas
- Capturar numeros, fechas y datos concretos
- Los inputs personales/familiares no se incluyen en topics de negocio pero si en el summary general

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": "resumen ejecutivo de la semana",
  "topics": [
    { "name": "nombre del tema", "relevance": 8, "context": "contexto breve" }
  ],
  "decisions": [
    { "decision": "descripcion de la decision", "stakeholders": ["nombre"], "date": "fecha si se menciona" }
  ],
  "concerns": [
    { "concern": "descripcion", "severity": "high|medium|low" }
  ],
  "opportunities": [
    { "opportunity": "descripcion", "potential": "high|medium|low", "nextStep": "siguiente paso sugerido" }
  ],
  "mentions": {
    "people": ["nombre1", "nombre2"],
    "companies": ["empresa1", "empresa2"]
  }
}`;

export async function runCorpusBuilder(instanceId: string, weekNumber: number, year: number) {
  console.log(`[CorpusBuilder] Processing inputs for instance ${instanceId}, week ${weekNumber}/${year}`);

  // Get all PENDING inputs for this instance
  const inputs = await prisma.inputFile.findMany({
    where: { instanceId, status: 'PENDING' },
    orderBy: { uploadedAt: 'asc' },
  });

  if (inputs.length === 0) {
    console.log('[CorpusBuilder] No pending inputs found');
    return null;
  }

  console.log(`[CorpusBuilder] Found ${inputs.length} pending inputs`);

  // Build the user prompt with all inputs
  const inputTexts = inputs.map((input) =>
    `--- ${input.type}: ${input.filename} ---\n${input.content}`
  ).join('\n\n');

  const userPrompt = `Procesa los siguientes ${inputs.length} inputs de esta semana y extrae informacion estructurada:\n\n${inputTexts}`;

  // Call Claude to extract structured data
  const result = await callSonnet(CORPUS_SYSTEM_PROMPT, userPrompt, 8192);

  // Create or update weekly corpus
  const corpus = await prisma.weeklyCorpus.upsert({
    where: {
      instanceId_weekNumber_year: { instanceId, weekNumber, year },
    },
    update: {
      summary: result.summary as any ?? {},
      topics: result.topics as any ?? [],
      decisions: result.decisions as any ?? [],
      concerns: result.concerns as any ?? [],
      opportunities: result.opportunities as any ?? [],
    },
    create: {
      instanceId,
      weekNumber,
      year,
      summary: result.summary as any ?? {},
      topics: result.topics as any ?? [],
      decisions: result.decisions as any ?? [],
      concerns: result.concerns as any ?? [],
      opportunities: result.opportunities as any ?? [],
    },
  });

  // Mark inputs as processed
  await prisma.inputFile.updateMany({
    where: { id: { in: inputs.map((i) => i.id) } },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  console.log(`[CorpusBuilder] Created corpus with ${(result.topics as any[])?.length ?? 0} topics`);
  return corpus;
}
