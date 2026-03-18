# Intelligence Hub — Sistema de Orquestación Central

## Qué es este sistema

Intelligence Hub es un sistema que transforma los inputs crudos de un cliente (WhatsApp, emails, audios, notas, entrevistas) en dos outputs paralelos:

1. **Contenido listo para publicar** en LinkedIn, X, Instagram y Blog
2. **Inteligencia semanal** sobre el cliente: patrones, oportunidades, evolución

Este archivo es el orquestador central. Todo agente que opere en esta carpeta debe leer este archivo primero y seguir estas instrucciones.

---

## Arquitectura del sistema

```
INPUTS CRUDOS → CORPUS BUILDER → BRAND VOICE (actualizado) → AGENTES EN PARALELO
                                                              ├── Contenido (4 plataformas)
                                                              └── Insights (inteligencia semanal)
```

### Capa 1: Inputs crudos (`/inputs/`)
Aquí se depositan los materiales en bruto del cliente: capturas de WhatsApp, mails, transcripciones de audio, notas sueltas, entrevistas. No se editan, se depositan tal cual.

### Capa 2: Corpus Builder (`/system/corpus_builder.md`)
Procesa todo lo que hay en `/inputs/`, extrae información estructurada y genera un corpus semanal. Es el motor de extracción.

### Capa 3: Brand Voice (`/system/brand_voice.md`)
El modelo vivo del cliente. Se completa en el onboarding inicial y se actualiza cada semana con lo que el corpus builder aprende. Es la fuente de verdad sobre quién es el cliente.

### Capa 4: Agentes de output
Trabajan en paralelo después de que el corpus está procesado:
- **Agentes de contenido**: LinkedIn, X, Instagram, Blog (cada uno con su skill en `/skills/`)
- **Agente de análisis**: Weekly Insights (el diferencial del sistema)

---

## Reglas fundamentales para el agente

1. **SIEMPRE lee `/system/brand_voice.md` antes de cualquier tarea.** Sin excepciones. Es tu contexto sobre quién es el cliente.
2. **SIEMPRE lee la skill relevante antes de generar contenido.** Los skills están en `/skills/` y contienen las instrucciones exactas de formato, tono y estructura para cada plataforma.
3. **NUNCA inventes información sobre el cliente.** Todo contenido debe estar basado en el corpus procesado de esa semana. Si no hay corpus, procesa los inputs primero.
4. **Mantené la voz del cliente.** No escribas como un agente genérico. Escribí como escribiría el cliente si tuviera tiempo y claridad para hacerlo.
5. **Actualizá el brand_voice.md** cada vez que proceses inputs nuevos. El perfil del cliente debe evolucionar semana a semana.

---

## Flujo semanal estándar

### Lunes (o inicio de ciclo)

**Paso 1 — Procesar inputs**
- Leer todos los archivos nuevos en `/inputs/`
- Ejecutar las instrucciones de `/system/corpus_builder.md`
- Generar el corpus estructurado de la semana

**Paso 2 — Actualizar brand voice**
- Con base en el corpus, actualizar `/system/brand_voice.md`
- Agregar nuevos temas, ajustar tono si hay evidencia, registrar evolución

**Paso 3 — Generar contenido (en paralelo)**
- Leer cada skill en `/skills/` (linkedin, x, instagram, blog)
- Generar el contenido de la semana para cada plataforma
- Guardar outputs en `/outputs/content/{plataforma}/`
- Nombrar archivos con fecha: `YYYY-MM-DD_plataforma_tipo.md`

**Paso 4 — Generar insights**
- Leer `/skills/weekly_insights_skill.md`
- Leer `/system/insights_extractor.md`
- Generar el reporte de inteligencia semanal
- Guardar en `/outputs/insights/YYYY-MM-DD_weekly_insights.md`

**Paso 5 — Distribuir**
- Presentar al operador un resumen de todo lo generado
- Listar los archivos creados con links relativos
- Destacar la oportunidad más relevante del reporte de insights

---

## Comandos rápidos

### `/procesar`
Ejecuta los pasos 1 y 2 del flujo semanal:
1. Lee todos los archivos en `/inputs/` (todas las subcarpetas)
2. Sigue las instrucciones de `/system/corpus_builder.md` para extraer y estructurar la información
3. Actualiza `/system/brand_voice.md` con lo aprendido
4. Genera un resumen del corpus en `/outputs/insights/YYYY-MM-DD_corpus_resumen.md`
5. Reporta qué encontró y qué actualizó

### `/contenido`
Ejecuta el paso 3 del flujo semanal:
1. Verifica que exista un corpus procesado reciente (si no, sugiere correr `/procesar` primero)
2. Lee `/system/brand_voice.md` para contexto del cliente
3. Lee cada skill de contenido en `/skills/`
4. Genera contenido para las 4 plataformas en paralelo
5. Guarda todo en `/outputs/content/` con la estructura de carpetas correspondiente
6. Presenta un resumen de lo generado

### `/insights`
Ejecuta el paso 4 del flujo semanal:
1. Verifica que exista un corpus procesado reciente
2. Lee `/system/brand_voice.md` y `/system/insights_extractor.md`
3. Lee `/skills/weekly_insights_skill.md`
4. Genera el reporte de inteligencia semanal
5. Guarda en `/outputs/insights/YYYY-MM-DD_weekly_insights.md`
6. Destaca los hallazgos más importantes

### `/demo`
Ejecuta el flujo completo usando los inputs de demostración:
1. Copia los archivos de `/demo_inputs/` a las carpetas correspondientes en `/inputs/`
2. Ejecuta `/procesar`
3. Ejecuta `/contenido`
4. Ejecuta `/insights`
5. Presenta un tour completo de lo generado, explicando cada parte

### `/onboarding`
Para configurar un nuevo cliente:
1. Lee `/system/brand_voice.md` como template
2. Guía al operador por cada sección, haciendo preguntas específicas
3. Completa el brand_voice.md con las respuestas
4. Sugiere qué tipo de inputs pedir al cliente para la primera semana
5. Genera un plan de contenido inicial basado en el perfil

---

## Convenciones de archivos

- **Idioma**: Todo en español
- **Nombres de archivo**: snake_case, con fecha al inicio cuando corresponda (`YYYY-MM-DD_`)
- **Formato**: Markdown para todo excepto cuando se indique lo contrario
- **Inputs**: Se depositan en la subcarpeta correspondiente de `/inputs/`. Un archivo por fuente o sesión.
- **Outputs**: Se guardan en la subcarpeta correspondiente de `/outputs/`. Nunca sobreescribir outputs anteriores.

---

## Integración con herramientas externas

Este sistema está diseñado para funcionar con Claude Cowork + Claude Code. Opcionalmente se integra con:

- **Notion** (vía MCP): Para mantener el content_planner sincronizado
- **Gmail** (vía MCP): Para recibir inputs por mail automáticamente
- **Google Drive** (vía MCP): Para almacenar outputs y compartir con el cliente

La integración con MCPs es opcional. El sistema funciona completamente en local con archivos markdown.

---

## Content Planner

El archivo `content_planner.md` en la raíz funciona como centro de comando. Registra:
- Qué contenido se generó cada semana
- Estado de cada pieza (borrador / revisado / publicado)
- Métricas de engagement cuando estén disponibles
- Notas del operador

---

## Cómo adaptar este template a un nuevo cliente

1. Cloná esta carpeta con un nombre descriptivo (ej: `intelligence-hub-martin`)
2. Ejecutá `/onboarding` para completar el `brand_voice.md`
3. Pedí al cliente sus primeros inputs (WhatsApp, mails, notas)
4. Depositá los inputs en `/inputs/`
5. Ejecutá `/procesar` → `/contenido` → `/insights`
6. Revisá los outputs, ajustá el brand_voice si es necesario
7. Repetí cada semana
