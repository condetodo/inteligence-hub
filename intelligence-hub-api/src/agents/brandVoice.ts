import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';

const BRAND_VOICE_SYSTEM_PROMPT = `Eres un analista de marca personal experto. Tu trabajo es actualizar el perfil de voz de marca de un cliente basandote en nuevos datos semanales.

Recibes:
1. El perfil de voz de marca ACTUAL
2. El corpus semanal NUEVO (temas, decisiones, preocupaciones, oportunidades)

Tu tarea:
- Analizar si hay nuevos patrones de comunicacion
- Identificar nuevos temas recurrentes
- Detectar cambios en tono o prioridades
- Generar un "insight" semanal sobre la evolucion de la marca personal

REGLAS:
- NO borrar informacion existente, solo AGREGAR o REFINAR
- Los insights semanales se acumulan (historial)
- Si no hay cambios significativos, indicarlo explicitamente
- Ser especifico sobre QUE cambio y POR QUE

FORMATO DE RESPUESTA (JSON estricto):
{
  "updatedFields": {
    "identity": "descripcion de quien es la persona/marca (si esta vacio o se puede mejorar)",
    "valueProposition": "propuesta de valor unica (si esta vacio o se puede mejorar)",
    "audience": "audiencia target (si esta vacio o se puede mejorar)",
    "positioning": "posicionamiento en el mercado (si esta vacio o se puede mejorar)",
    "metrics": "metricas clave o KPIs relevantes (si esta vacio o se puede mejorar)",
    "recurringTopics": ["lista actualizada de temas recurrentes si hay cambios"],
    "voiceTone": { "adjectives": ["lista actualizada si hay cambios"], "examples": ["ejemplos de frases tipicas"], "antiPatterns": ["cosas que NO diria"] }
  },
  "weeklyInsight": {
    "summary": "resumen del insight de esta semana",
    "newPatterns": ["patron nuevo detectado"],
    "recommendations": "recomendacion para la semana siguiente"
  },
  "significantChanges": true | false
}

IMPORTANTE: Si los campos identity, valueProposition, audience, positioning o metrics estan vacios, DEBES generarlos basandote en el corpus disponible.`;

export async function runBrandVoiceAgent(instanceId: string, weekNumber: number, year: number) {
  console.log(`[BrandVoice] Updating brand voice for instance ${instanceId}`);

  // Get current brand voice
  const brandVoice = await prisma.brandVoice.findUnique({
    where: { instanceId },
  });

  if (!brandVoice) {
    console.log('[BrandVoice] No brand voice found, skipping');
    return null;
  }

  // Get this week's corpus
  const corpus = await prisma.weeklyCorpus.findUnique({
    where: {
      instanceId_weekNumber_year: { instanceId, weekNumber, year },
    },
  });

  if (!corpus) {
    console.log('[BrandVoice] No corpus found for this week, skipping');
    return null;
  }

  const userPrompt = `VOZ DE MARCA ACTUAL:
${JSON.stringify({
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
  }, null, 2)}

CORPUS SEMANAL NUEVO:
${JSON.stringify({
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  }, null, 2)}

Analiza si hay cambios significativos en la voz de marca y genera el insight semanal.`;

  const { data: result } = await callOpus(BRAND_VOICE_SYSTEM_PROMPT, userPrompt);

  // Update brand voice with new data
  const updateData: any = {};
  const updatedFields = result.updatedFields as any;

  if (updatedFields?.identity) updateData.identity = updatedFields.identity;
  if (updatedFields?.valueProposition) updateData.valueProposition = updatedFields.valueProposition;
  if (updatedFields?.audience) updateData.audience = updatedFields.audience;
  if (updatedFields?.positioning) updateData.positioning = updatedFields.positioning;
  if (updatedFields?.metrics) updateData.metrics = updatedFields.metrics;
  if (updatedFields?.recurringTopics) updateData.recurringTopics = updatedFields.recurringTopics;
  if (updatedFields?.voiceTone) updateData.voiceTone = updatedFields.voiceTone;

  // Add weekly insight to history
  const currentHistory = (brandVoice.insightHistory as any[]) || [];
  const weeklyInsight = result.weeklyInsight as any;
  if (weeklyInsight) {
    updateData.insightHistory = [
      ...currentHistory,
      { weekNumber, year, ...weeklyInsight },
    ];
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.brandVoice.update({
      where: { instanceId },
      data: updateData,
    });
    console.log(`[BrandVoice] Updated brand voice, significant changes: ${result.significantChanges}`);
  } else {
    console.log('[BrandVoice] No updates needed');
  }

  return result;
}
