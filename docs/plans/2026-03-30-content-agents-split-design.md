# Content Agents Split — Design Doc

**Fecha:** 2026-03-30
**Objetivo:** Separar el content agent monolitico en un agente independiente por plataforma para maximizar calidad y permitir iteracion individual.

---

## Motivacion

- Calidad es el diferencial del producto. Cada plataforma tiene reglas, formatos y tonos distintos.
- El `content.ts` actual (246 lineas) mezcla orquestacion, generacion y persistencia para 4 plataformas.
- Mejorar una plataforma requiere tocar el mismo archivo que las demas.
- Si una plataforma falla, puede afectar a las otras.
- A futuro se quiere poder usar modelos diferentes por plataforma (Opcion C).

## Arquitectura

### Antes (monolito)

```
content.ts (orquesta + persiste + imagenes para TODAS las plataformas)
  ├── linkedinSkill.ts (solo genera JSON)
  ├── xSkill.ts
  ├── tiktokSkill.ts
  └── blogSkill.ts
```

### Despues (agentes independientes)

```
contentOrchestrator.ts  (solo carga datos y dispara agentes en paralelo)
  ├── linkedinAgent.ts  (genera + persiste + imagenes)
  ├── xAgent.ts         (genera + persiste + imagenes)
  ├── tiktokAgent.ts    (genera + persiste)
  └── blogAgent.ts      (genera + persiste + imagenes)
```

## Contrato comun de agentes

```typescript
async function runXxxAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: BrandVoiceData,
  corpus: CorpusData,
  config: PlatformConfig
): Promise<ContentOutput[]>
```

Cada agente:
1. Construye system prompt + user prompt (absorbe el skill actual)
2. Llama al modelo (Opus por ahora, configurable por agente a futuro)
3. Parsea respuesta JSON
4. Genera imagenes si aplica (via nanoBanana)
5. Persiste en DB como DRAFT
6. Retorna ContentOutput[] creados

## Orquestador

El `contentOrchestrator.ts`:
1. Carga brandVoice, corpus, platformConfigs desde DB
2. Prepara datos comunes (brandVoiceData, corpusData, activeMemory)
3. Dispara agentes habilitados en paralelo con Promise.all
4. Retorna todos los outputs concatenados

## Cambios

| Accion | Archivo | Detalle |
|--------|---------|---------|
| Crear | `agents/linkedinAgent.ts` | Absorbe linkedinSkill + persistencia/imagenes |
| Crear | `agents/xAgent.ts` | Absorbe xSkill + persistencia tweets/threads |
| Crear | `agents/tiktokAgent.ts` | Absorbe tiktokSkill + persistencia scripts |
| Crear | `agents/blogAgent.ts` | Absorbe blogSkill + persistencia articulo |
| Reescribir | `agents/content.ts` -> `agents/contentOrchestrator.ts` | Solo orquestacion (~50 lineas) |
| Borrar | `skills/linkedinSkill.ts` | Absorbido por linkedinAgent |
| Borrar | `skills/xSkill.ts` | Absorbido por xAgent |
| Borrar | `skills/tiktokSkill.ts` | Absorbido por tiktokAgent |
| Borrar | `skills/blogSkill.ts` | Absorbido por blogAgent |
| Actualizar | `orchestrator.ts` | Cambiar import a runContentOrchestrator |

## Lo que NO cambia

- System prompts (se mueven tal cual)
- Formatos JSON de respuesta
- Esquema de DB
- API endpoints
- Frontend

## Preparacion para Opcion C (multi-provider)

Cada agente importa su propia funcion de llamada al modelo. Cuando se quiera cambiar LinkedIn a GPT-4o, solo se toca el import en `linkedinAgent.ts`. No se necesita un model registry central.

## Modelo actual por agente

Todos usan Claude Opus (`callOpus`) para maximizar calidad.
