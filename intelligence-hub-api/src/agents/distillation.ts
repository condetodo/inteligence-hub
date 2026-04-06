import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';
import { logUsage } from '../lib/usageLogger';

const DISTILLATION_SYSTEM_PROMPT = `Eres un analista de inteligencia personal experto. Tu trabajo es actualizar el perfil base de un Digital Twin (representacion digital de un CEO o lider) basandote en nuevos datos semanales.

Recibes:
1. PERFIL BASE ACTUAL — La representacion acumulada de quien es esta persona
2. CORPUS NUEVO — Informacion fresca extraida de inputs recientes
3. CAMPOS BLOQUEADOS — Campos que el equipo edito manualmente y NO debes modificar
4. CAMPOS ESTATICOS BLOQUEADOS — Si es true, los campos de identidad estatica (identity, valueProposition, audience, voiceTone, positioning, metrics, recurringTopics) estan protegidos y NO debes modificarlos. Solo puedes actualizar campos de KB dinamico (topics, contacts, narratives, insightHistory).

Tu tarea es actualizar el perfil base con la nueva informacion:

REGLAS:
- NUNCA modificar campos que estan en la lista de bloqueados
- Si CAMPOS ESTATICOS BLOQUEADOS es true:
  - NO modificar: identity, valueProposition, audience, voiceTone, positioning, metrics, recurringTopics
  - SOLO actualizar: topics, contacts, narratives
  - Si detectas que el contenido semanal contradice o podria mejorar los campos estaticos, reportalo en weeklyInsight.staticSuggestions en vez de modificar directamente
- Para temas (topics): actualizar posiciones si cambiaron, agregar nuevos, mantener existentes
- Para contactos: agregar nuevos mencionados, actualizar frecuencia de existentes
- Para narrativas: detectar proyectos/iniciativas activas, marcar inactivas si dejaron de mencionarse
- La posicion MAS RECIENTE siempre gana sobre la anterior (ultimo gana)
- Ser especifico y concreto, no generico
- Mantener consistencia con la identidad y voz existente

FORMATO DE RESPUESTA (JSON estricto):
{
  "updatedFields": {
    "identity": "identidad actualizada (o null si no cambio, esta bloqueado, o campos estaticos bloqueados)",
    "valueProposition": "propuesta actualizada (o null si no cambio, esta bloqueado, o campos estaticos bloqueados)",
    "audience": "audiencia actualizada (o null si no cambio, esta bloqueado, o campos estaticos bloqueados)",
    "positioning": "posicionamiento actualizado (o null si no cambio, esta bloqueado, o campos estaticos bloqueados)",
    "voiceTone": { "adjectives": [], "examples": [], "antiPatterns": [] },
    "recurringTopics": ["temas recurrentes actualizados"]
  },
  "topics": [
    { "name": "nombre", "position": "posicion/opinion actual", "evidence": "de donde viene", "status": "active|cooling" }
  ],
  "contacts": [
    { "name": "nombre", "company": "empresa", "context": "relacion/contexto", "frequency": "high|medium|low" }
  ],
  "narratives": [
    { "name": "nombre del proyecto/iniciativa", "status": "active|completed|stalled", "context": "contexto actual", "startedWeek": "semana en que se detecto" }
  ],
  "weeklyInsight": {
    "summary": "resumen del insight de este periodo",
    "newPatterns": ["patron nuevo detectado"],
    "recommendations": "recomendacion para el siguiente periodo",
    "staticSuggestions": ["sugerencia de cambio a campo estatico (solo si staticFieldsLocked es true y se detectaron contradicciones o mejoras)"]
  }
}`;

export async function runDistillationAgent(instanceId: string, weekNumber: number, year: number, runId?: string) {
  console.log(`[Distillation] Updating KB for instance ${instanceId}, period ${weekNumber}/${year}`);

  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  if (!brandVoice) {
    console.log('[Distillation] No brand voice / KB found, skipping');
    return null;
  }

  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });
  if (!corpus) {
    console.log('[Distillation] No corpus found, skipping');
    return null;
  }

  const lockedFields = (brandVoice.lockedFields as Record<string, boolean>) || {};
  const currentTopics = (brandVoice as any).topics || [];
  const currentContacts = (brandVoice as any).contacts || [];
  const currentNarratives = (brandVoice as any).narratives || [];

  const userPrompt = `PERFIL BASE ACTUAL:
${JSON.stringify({
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
    topics: currentTopics,
    contacts: currentContacts,
    narratives: currentNarratives,
  }, null, 2)}

CORPUS NUEVO (Periodo ${weekNumber}, ${year}):
${JSON.stringify({
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  }, null, 2)}

CAMPOS BLOQUEADOS (NO modificar):
${JSON.stringify(Object.entries(lockedFields).filter(([, v]) => v).map(([k]) => k))}

CAMPOS ESTATICOS BLOQUEADOS: ${brandVoice.staticFieldsLocked ? 'true — NO modificar campos de identidad estatica (identity, valueProposition, audience, voiceTone, positioning, metrics, recurringTopics). Solo actualizar KB dinamico (topics, contacts, narratives). Si detectas contradicciones o mejoras para campos estaticos, reportalas en weeklyInsight.staticSuggestions.' : 'false — puedes actualizar todos los campos no bloqueados.'}

Actualiza el perfil base del Digital Twin con la nueva informacion.`;

  const { data: result, usage } = await callOpus(DISTILLATION_SYSTEM_PROMPT, userPrompt, 8192);

  if (usage && runId) {
    await logUsage({
      instanceId,
      processingRunId: runId,
      provider: 'anthropic',
      model: usage.model,
      stepName: 'distillation',
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    }).catch((e) => console.error('[Distillation] Usage logging failed:', e.message));
  }

  // Build update data, respecting locked fields
  const updateData: Record<string, any> = {};
  const updatedFields = result.updatedFields as any;

  if (updatedFields) {
    const textFields = ['identity', 'valueProposition', 'audience', 'positioning'] as const;
    for (const field of textFields) {
      if (updatedFields[field] && !lockedFields[field]) {
        updateData[field] = updatedFields[field];
      }
    }
    if (updatedFields.voiceTone && !lockedFields['voiceTone']) {
      updateData.voiceTone = updatedFields.voiceTone;
    }
    if (updatedFields.recurringTopics && !lockedFields['recurringTopics']) {
      updateData.recurringTopics = updatedFields.recurringTopics;
    }
  }

  // Update KB-specific fields (topics, contacts, narratives)
  if (result.topics) updateData.topics = result.topics;
  if (result.contacts) updateData.contacts = result.contacts;
  if (result.narratives) updateData.narratives = result.narratives;

  // Add weekly insight to history
  const currentHistory = (brandVoice.insightHistory as any[]) || [];
  const weeklyInsight = result.weeklyInsight as any;
  if (weeklyInsight) {
    updateData.insightHistory = [
      ...currentHistory,
      { weekNumber, year, ...weeklyInsight },
    ];
  }

  // Enforce static fields protection as a safety net (even if the AI respected the prompt)
  const staticFields = ['identity', 'valueProposition', 'audience', 'voiceTone', 'positioning', 'metrics', 'recurringTopics'];
  if (brandVoice.staticFieldsLocked) {
    for (const field of staticFields) {
      delete updateData[field];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.brandVoice.update({
      where: { instanceId },
      data: updateData,
    });
    console.log('[Distillation] KB updated successfully');
  } else {
    console.log('[Distillation] No updates needed');
  }

  return result;
}
