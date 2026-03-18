# Corpus Builder — Instrucciones de Procesamiento

> Este documento contiene las instrucciones exactas para procesar los inputs crudos del cliente y convertirlos en un corpus estructurado que alimenta el resto del sistema.

---

## Objetivo

Transformar los inputs crudos depositados en `/inputs/` en información estructurada, extraer inteligencia accionable y actualizar el perfil del cliente en `brand_voice.md`.

---

## Paso 1: Inventario de inputs

Antes de procesar, hacé un inventario de todo lo disponible:

1. Recorré cada subcarpeta de `/inputs/`:
   - `/inputs/whatsapp/` — conversaciones de WhatsApp
   - `/inputs/emails/` — correos electrónicos
   - `/inputs/audio_transcripts/` — transcripciones de audios o calls
   - `/inputs/notes/` — notas sueltas, ideas, reflexiones
   - `/inputs/interviews/` — transcripciones de entrevistas o sesiones

2. Listá todos los archivos encontrados con:
   - Nombre del archivo
   - Tipo de input (whatsapp / email / audio / nota / entrevista)
   - Tamaño aproximado (corto / medio / largo)
   - Fecha si está disponible

3. Reportá el inventario antes de procesar.

---

## Paso 2: Extracción por categoría

Para CADA archivo de input, extraé la siguiente información. Sé exhaustivo — es mejor extraer de más que de menos.

### A. Temas mencionados
- Lista de temas o asuntos que aparecen en el input
- Para cada tema: frecuencia (¿se menciona una vez o vuelve a aparecer?), nivel de importancia percibida (el cliente lo menciona de pasada o con énfasis)
- Clasificá cada tema: negocio / personal / industria / competencia / oportunidad / problema

### B. Decisiones tomadas o en proceso
- Decisiones que el cliente comunicó como tomadas ("decidí que...", "vamos a...")
- Decisiones en evaluación ("estoy pensando en...", "no sé si...")
- Para cada una: contexto, opciones consideradas, inclinación percibida

### C. Problemas y preocupaciones
- Qué le preocupa al cliente
- Qué problemas menciona (propios, de clientes, del mercado)
- Nivel de urgencia percibido (mención casual vs. preocupación activa)

### D. Oportunidades que ve
- Oportunidades de negocio que menciona
- Ideas que está explorando
- Mercados o clientes nuevos que le interesan
- Tecnologías o tendencias que le llaman la atención

### E. Proyectos activos
- Proyectos en los que está trabajando activamente
- Estado de cada uno (inicio / en progreso / bloqueado / finalizando)
- Recursos involucrados (personas, herramientas, presupuesto si se menciona)

### F. Red de contactos mencionados
- Nombres de personas que aparecen en los inputs
- Relación con el cliente (cliente / socio / empleado / mentor / amigo / familia)
- Contexto de la mención (para qué apareció el nombre)

### G. Frases textuales destacadas
- Frases que capturan la forma de pensar del cliente
- Frases que podrían funcionar como base para contenido
- Expresiones recurrentes o muletillas
- Metáforas o analogías que usa

### H. Datos y números
- Cualquier dato cuantitativo mencionado (facturación, clientes, métricas, plazos)
- Contexto del dato (es una meta, un resultado, una estimación)

---

## Paso 3: Síntesis del corpus semanal

Después de procesar todos los inputs, generá un documento de síntesis con esta estructura exacta:

```markdown
# Corpus Semanal — [YYYY-MM-DD]

## Resumen ejecutivo
[3-5 oraciones que capturan lo más importante de esta semana]

## Temas de la semana (ordenados por relevancia)
1. **[Tema]**: [descripción + evidencia del corpus]
2. **[Tema]**: [descripción + evidencia del corpus]
3. **[Tema]**: [descripción + evidencia del corpus]
[... hasta cubrir todos los temas relevantes]

## Decisiones registradas
- [Decisión]: [contexto] — Estado: [tomada / en evaluación]

## Problemas activos
- [Problema]: [descripción] — Urgencia: [alta / media / baja]

## Oportunidades detectadas
- [Oportunidad]: [descripción] — Potencial: [alto / medio / bajo]

## Proyectos en movimiento
- [Proyecto]: [estado actual] — [novedad de esta semana]

## Frases destacadas para contenido
> "[Frase 1]" — Contexto: [de dónde salió]
> "[Frase 2]" — Contexto: [de dónde salió]
> "[Frase 3]" — Contexto: [de dónde salió]

## Red de contactos actualizada
- [Nombre]: [rol] — [contexto de mención]

## Datos y métricas
- [Dato]: [contexto]

## Señales de contenido
[Lista de posibles ángulos para contenido basados en lo procesado esta semana.
Cada señal debe incluir: tema, plataforma sugerida, tipo de contenido, y la
evidencia del corpus que lo sustenta.]
```

---

## Paso 4: Actualización de brand_voice.md

Con el corpus procesado, actualizá `/system/brand_voice.md`:

1. **Temas recurrentes**: Agregá temas nuevos que no estaban. Ajustá el orden si las prioridades cambiaron.
2. **Voz y tono**: Agregá frases textuales nuevas que capturan su forma de hablar. Si notás un cambio de tono (más optimista, más preocupado), registralo.
3. **Historial de insights**: Agregá una entrada nueva en la sección correspondiente con la fecha de esta semana.
4. **Posicionamiento**: Si hay evidencia de que el posicionamiento deseado o actual cambió, actualizá.
5. **Métricas**: Si mencionó nuevas métricas o cambió sus prioridades, actualizá.

**IMPORTANTE**: No borres información anterior. Agregá, no reemplaces. El historial es valioso.

---

## Paso 5: Guardar el corpus

Guardá el documento de síntesis en:
`/outputs/insights/YYYY-MM-DD_corpus_resumen.md`

---

## Reglas de procesamiento

- **Confidencialidad**: Si un input contiene información claramente confidencial (números de cuenta, contraseñas, datos médicos), marcalo como "[DATO CONFIDENCIAL OMITIDO]" y no lo incluyas en el corpus.
- **Contexto personal**: Información personal (familia, salud, vida privada) se registra solo si es relevante para entender el estado emocional o las decisiones del cliente. Nunca se usa como contenido.
- **Duplicados**: Si el mismo tema aparece en múltiples inputs, consolidá en una sola entrada pero registrá las múltiples fuentes como evidencia de su importancia.
- **Ambigüedad**: Si algo no está claro, registralo como ambiguo antes que inventar una interpretación. Marcá con [VERIFICAR CON CLIENTE].
- **Idioma**: Mantené las frases textuales en el idioma original del cliente, incluso si el corpus se escribe en español.
