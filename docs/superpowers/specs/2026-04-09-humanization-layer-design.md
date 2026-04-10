# Capa de Humanizacion Transversal

**Fecha:** 2026-04-09
**Objetivo:** Eliminar patrones tipicos de escritura AI del contenido generado por todos los agentes, sin interferir con la configuracion de Brand Voice ni los anti-patrones comunicacionales existentes.

---

## Problema

El contenido generado presenta patrones reconocibles de AI:

| Patron | Ejemplo |
|--------|---------|
| Oraciones cortas concatenadas | "Es clave. Es necesario. Es urgente." |
| No usa primera persona | "Se debe considerar..." en vez de "Yo creo que..." |
| Frases comodin/ambiguas | "en el mundo actual", "es importante destacar" |
| Vocabulario seguro/generico | "ademas", "en conclusion", "cabe mencionar" |
| Estructura lineal rigida | "Primero... Segundo... Tercero..." |
| Prosa florida/verbosa | 3 parrafos donde caben 3 lineas |
| Falta de personalidad | Todo suena igual, sin matices ni peculiaridades |
| Ambiguedad calculada | Frases que significan todo y nada segun quien lea |

## Decision clave: separacion de responsabilidades

- **Anti-patrones del Brand Voice** = "que NO diria esta marca" (comunicacional, por instancia). Ejemplo: "Gracias por invitarme", "Me siento muy honrado". **No se tocan.**
- **Capa de humanizacion** = "como NO debe escribir la AI" (estructural, universal). Aplica a todas las instancias y plataformas.

Estas dos capas son independientes y no se interfieren.

## Arquitectura

### Nuevo archivo: `agents/humanizationLayer.ts`

Exporta una funcion `getHumanizationDirectives(platform: string): string` que devuelve un bloque de texto con reglas de escritura natural, adaptadas por plataforma.

### Contenido del modulo

#### A) Reglas base universales

Aplican a todas las plataformas:

1. **Ritmo de oraciones:** Variar la longitud. Mezclar frases de 5 palabras con otras de 25. El ritmo monotono delata a la AI.

2. **Primera persona:** Escribir en primera persona cuando el autor opina. "Yo creo", "A mi me paso", "Lo que vi fue...". La voz pasiva e impersonal es un patron AI.

3. **Palabras prohibidas (comodin):** PROHIBIDO usar: "en el mundo actual", "es importante destacar", "cabe mencionar", "en este sentido", "sin lugar a dudas", "en conclusion", "hoy en dia", "en la actualidad".

4. **Vocabulario prohibido (generico):** PROHIBIDO: "ademas", "asimismo", "por otro lado", "potenciar", "transformar", "revolucionar", "impulsar", "sin precedentes", "paradigma", "sinergia", "holístico".

5. **Estructura no lineal:** NUNCA usar Primero/Segundo/Tercero como estructura visible. NUNCA Contexto-Problema-Solucion como esquema predecible. Romper el orden. Empezar por la conclusion, por una anecdota, por un dato suelto.

6. **Economia de palabras:** Si una oracion no agrega informacion nueva, eliminarla. Menos palabras = mas impacto. No repetir la misma idea con distintas palabras.

7. **Imperfecciones deliberadas:** Incluir matices humanos: una digresion, una duda expresada, un "no se si esto aplica para todos, pero...". Las personas reales no son perfectas ni tienen todo resuelto.

8. **Concrecion:** Ser especifico. No "mejorar los procesos" sino "reducir el tiempo de respuesta de 48h a 12h". Si no hay dato exacto en el corpus, usar uno verosimil del contexto.

#### B) Ajustes por plataforma

**TikTok:**
- Las oraciones cortas concatenadas SI son validas (es guion hablado, no prosa)
- Relajar la regla de ritmo de oraciones
- Reforzar: naturalidad oral, muletillas reales del habla ("mira", "te cuento", "ojo con esto")
- El guion debe sonar como alguien hablando, no leyendo

**X (Twitter):**
- El limite de 280 chars exige concision natural, la regla de prosa florida no aplica igual
- Reforzar: vocabulario prohibido y primera persona
- Permitir frases cortas e impactantes (es el formato nativo de X)

**Blog:**
- Aplicar TODAS las reglas con maxima intensidad — es donde mas se nota la escritura AI
- Reforzar especialmente: estructura no lineal, economia de palabras, imperfecciones deliberadas
- El articulo debe tener personalidad y ritmo propio, no sonar a Wikipedia

**LinkedIn:**
- Aplicar todas las reglas base
- Agregar anti-patrones especificos de formato LinkedIn AI: posts motivacionales genericos, storytelling forzado con "moraleja", listas de "5 lecciones que aprendi"
- Reforzar primera persona y concrecion

## Integracion

### Punto de conexion unico: `contentOrchestrator.ts`

No se modifica la logica interna de ningun agente. Solo se agrega un parametro mas.

### Flujo actualizado

```
orchestrator
  -> carga styleByPlatform (existente)
  -> genera humanizationContext por plataforma (NUEVO)
  -> llama cada agente con ambos contextos
  -> agente arma prompt incluyendo humanizationContext
```

### Posicion en el prompt del agente

```
BRAND VOICE (identidad fija): ...
CORPUS SEMANAL: ...
DOCUMENTOS ESTRATEGICOS: ...
[configContext]
[benchmark]
[styleContext]              <- sliders + instrucciones usuario
[humanizationContext]       <- NUEVO: reglas de escritura natural
Genera X publicaciones...   <- instruccion final
```

El bloque de humanizacion va despues del styleContext y antes de la instruccion final. Esta posicion le da peso alto en el prompt.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `agents/humanizationLayer.ts` | **NUEVO** - modulo con reglas base + ajustes por plataforma |
| `agents/contentOrchestrator.ts` | Importar `getHumanizationDirectives`, generar contexto por plataforma, pasarlo a cada `runXxxAgent()` |
| `agents/linkedinAgent.ts` | Agregar parametro `humanizationContext` a `runLinkedInAgent()` y `buildLinkedInUserPrompt()`, inyectarlo en el prompt |
| `agents/xAgent.ts` | Idem |
| `agents/blogAgent.ts` | Idem |
| `agents/tiktokAgent.ts` | Idem |

### Lo que NO se toca

- **Brand Voice** (anti-patrones comunicacionales) - intacto
- **System prompts de cada agente** (reglas de formato, tipos de post) - intactos
- **AgentPersonalityPanel** (UI de personalidad) - intacto
- **Schema de base de datos** - sin cambios, no se persiste nada nuevo

## Visibilidad

La capa es **invisible para el usuario**. Siempre activa, sin toggle ni configuracion. Es parte del motor de escritura, como un corrector ortografico.

## Riesgos y mitigacion

| Riesgo | Mitigacion |
|--------|-----------|
| Las reglas prohibitivas hacen que Claude "se trabe" o genere contenido forzado | Las reglas dicen que hacer ademas de que no hacer. Cada prohibicion tiene una alternativa concreta. |
| Conflicto entre humanizacion y styleContext del usuario | No hay conflicto conceptual: styleContext dice "como quiero que suene mi marca", humanizacion dice "como escribir naturalmente". Son complementarios. |
| Reglas demasiado agresivas para TikTok (guion hablado) | Ajustes por plataforma relajan reglas que no aplican al formato oral. |
| Aumento de tokens en el prompt | Minimo: el bloque de humanizacion es ~300-400 tokens. Negligible vs el prompt total. |
