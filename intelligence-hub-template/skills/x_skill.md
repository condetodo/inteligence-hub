# Skill: X (Twitter) Posts

> Instrucciones para generar contenido en X/Twitter para el cliente. Leé siempre `brand_voice.md` antes de usar esta skill.

---

## Output semanal esperado

- **2 tweets standalone** (280 caracteres máximo cada uno)
- **1 hilo** de 5-8 tweets

---

## Tweets standalone

### Características
- **280 caracteres máximo**. Ni un carácter más. Contá antes de entregar.
- **Una sola idea por tweet**. Clara, directa, memorable.
- **Sin hashtags** (en X los hashtags orgánicos ya no suman alcance significativo).
- **Sin emojis** salvo que el brand_voice lo permita explícitamente.

### Tipos de tweet que funcionan

| Tipo | Ejemplo | Cuándo usarlo |
|------|---------|---------------|
| Observación afilada | "Las empresas que más hablan de innovación son las que menos innovan." | Cuando el corpus tiene una opinión fuerte del cliente |
| Verdad incómoda | "No necesitás más herramientas. Necesitás usar bien las 3 que ya tenés." | Cuando el cliente identificó un problema común |
| Dato + perspectiva | "Una PYME promedio pierde 12 horas/semana en tareas que se automatizan en 2 días." | Cuando el corpus tiene datos o métricas |
| Experiencia destilada | "Aprendí más de 1 cliente que se fue que de 10 que se quedaron." | Cuando el corpus tiene aprendizajes personales |
| Pregunta retórica | "Si tu proceso depende de una persona que no puede faltar nunca... ¿eso es un proceso?" | Cuando queremos generar engagement |

### Reglas de redacción para tweets
- Cada palabra debe ganarse su lugar. Si podés decir lo mismo con menos palabras, hacelo.
- Priorizá el ritmo sobre la gramática perfecta. Los tweets son conversacionales.
- La primera palabra es clave — determiná si alguien sigue leyendo.
- Evitá empezar con "Yo" o "Mi" salvo que sea necesario para la idea.
- Si el tweet necesita contexto para entenderse, no funciona como standalone.

---

## Hilos

### Estructura obligatoria

```
Tweet 1 (GANCHO): La frase que hace que alguien quiera leer el hilo.
                   Debe funcionar como tweet standalone también.
                   Terminá con "🧵" o "Abro hilo:" solo si el brand_voice lo permite.

Tweet 2-3 (CONTEXTO): Situá el problema o la observación.
                        ¿Por qué importa? ¿A quién le pasa?

Tweet 4-6 (DESARROLLO): El argumento central, la historia, o los pasos.
                          Un punto por tweet. No amontones.

Tweet 7 (CONCLUSIÓN): El insight final. La frase que se queda.
                       Algo accionable o una reflexión potente.

Tweet 8 (CTA - opcional): Invitación a la conversación o referencia
                           a un recurso/contenido propio.
```

### Reglas de hilos
- **Cada tweet del hilo debe tener valor por sí solo.** Si alguien lee solo el tweet 4, debe entender algo.
- **No numerar los tweets** ("1/7", "2/7") salvo que sea estrictamente necesario para la claridad.
- **Máximo 280 caracteres por tweet** del hilo. Sin excepciones.
- **Conectar tweets con fluidez.** El final de un tweet debe generar curiosidad sobre el siguiente, pero sin usar frases puente artificiales como "¿Y sabés qué pasó?".
- **El primer tweet es el más importante.** Si no funciona como gancho, reescribilo.

---

## Tono para X

- **Más directo que LinkedIn.** X premia la concisión y la opinión clara.
- **Sin rodeos.** No uses 3 oraciones donde 1 alcanza.
- **Conversacional pero con sustancia.** No es un chat, es un escenario con audiencia.
- **Opinado.** Los tweets tibios no funcionan. Tomá posición.
- **Basado en el corpus.** Cada tweet debe tener raíz en algo que el cliente dijo, pensó o experimentó esta semana.

---

## Proceso de generación

1. Leé el corpus de la semana y el brand_voice
2. Identificá las ideas más potentes y concisas del corpus
3. Para tweets standalone: destilá cada idea a su expresión más compacta
4. Para el hilo: elegí el tema más rico del corpus, que aguante 5-8 tweets de desarrollo
5. Escribí el gancho del hilo primero. Si no enganchás en el tweet 1, cambiá el tema.
6. Verificá que cada tweet tenga ≤280 caracteres
7. Leé todo en voz alta — si suena forzado o robótico, reescribí

---

## Formato de entrega

```markdown
# X/Twitter — Contenido Semanal [YYYY-MM-DD]

## Tweet Standalone 1
**Tema del corpus**: [tema]
**Tipo**: [observación / verdad incómoda / dato / experiencia / pregunta]

> [Texto del tweet — ≤280 caracteres]

Caracteres: [N]/280

---

## Tweet Standalone 2
**Tema del corpus**: [tema]
**Tipo**: [tipo]

> [Texto del tweet — ≤280 caracteres]

Caracteres: [N]/280

---

## Hilo: [Título interno del hilo]
**Tema del corpus**: [tema]
**Ángulo**: [descripción en 1 línea del enfoque]

**Tweet 1 (gancho)**:
> [texto]

**Tweet 2**:
> [texto]

**Tweet 3**:
> [texto]

[... hasta tweet 5-8]

---

**Notas para el operador**: [sugerencias de timing, contexto, o ajustes]
```

Guardá todo en: `/outputs/content/x/YYYY-MM-DD_x_posts.md`
