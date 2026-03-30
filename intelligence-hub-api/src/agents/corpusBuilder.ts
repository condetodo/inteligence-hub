import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';

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

export async function runCorpusBuilder(
  instanceId: string,
  weekNumber: number,
  year: number,
  periodStart: Date,
  periodEnd: Date,
) {
  console.log(`[CorpusBuilder] Processing inputs for instance ${instanceId}, period ${weekNumber}/${year}`);

  // Get all inputs uploaded within the current period
  const allInputs = await prisma.inputFile.findMany({
    where: {
      instanceId,
      uploadedAt: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { uploadedAt: 'asc' },
  });

  const pendingInputs = allInputs.filter((i) => i.status === 'PENDING');

  if (allInputs.length === 0) {
    console.log('[CorpusBuilder] No inputs found in current period');
    return null;
  }

  if (pendingInputs.length === 0) {
    console.log('[CorpusBuilder] No new pending inputs in current period');
    return null;
  }

  console.log(`[CorpusBuilder] Found ${allInputs.length} total inputs (${pendingInputs.length} new)`);

  // Build the user prompt with ALL inputs from the period
  const inputTexts = allInputs.map((input) =>
    `--- ${input.type}: ${input.filename} ---\n${input.content}`
  ).join('\n\n');

  const userPrompt = `Procesa los siguientes ${allInputs.length} inputs de este periodo y extrae informacion estructurada:\n\n${inputTexts}`;

  const result = await callOpus(CORPUS_SYSTEM_PROMPT, userPrompt, 8192);

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
      instanceId, weekNumber, year,
      summary: result.summary as any ?? {},
      topics: result.topics as any ?? [],
      decisions: result.decisions as any ?? [],
      concerns: result.concerns as any ?? [],
      opportunities: result.opportunities as any ?? [],
    },
  });

  // Mark only the pending inputs as processed
  await prisma.inputFile.updateMany({
    where: { id: { in: pendingInputs.map((i) => i.id) } },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  console.log(`[CorpusBuilder] Created corpus with ${(result.topics as any[])?.length ?? 0} topics`);
  return corpus;
}
