# Skill: Blog / SEO Articles

> Instrucciones para generar artículos de blog optimizados para SEO. Leé siempre `brand_voice.md` antes de usar esta skill.

---

## Output semanal esperado

**1 artículo completo por semana** basado en el tema más fuerte del corpus.

---

## Estructura del artículo

```markdown
# [H1: Título con keyword principal — máximo 60 caracteres]

**Meta description**: [155 caracteres máximo, incluye keyword, genera curiosidad]

**Keywords**: Principal: [keyword] | Secundarias: [3-5 keywords relacionadas]

---

## Introducción (100-150 palabras)
- Hook que enganche en las primeras 2 oraciones
- Contexto del problema o tema
- Promesa de lo que va a encontrar el lector
- Mención natural de la keyword principal

## [H2: Primera sección — incluir keyword secundaria si es natural]
(200-250 palabras)
- Desarrollo del primer punto
- Ejemplo concreto o caso de uso
- Datos si están disponibles

## [H2: Segunda sección]
(200-250 palabras)
- Desarrollo del segundo punto
- Historia o experiencia del cliente
- Conexión con el punto anterior

## [H2: Tercera sección]
(200-250 palabras)
- Desarrollo del tercer punto
- Perspectiva diferenciadora del cliente
- Aplicación práctica para el lector

## [H2: Sección adicional (opcional)]
(150-200 palabras)
- Solo si el tema lo requiere
- No agregar secciones por rellenar

## Conclusión (100-150 palabras)
- Resumen del argumento principal (no repetir, sintetizar)
- Reflexión final o perspectiva del cliente
- CTA: qué debería hacer el lector ahora
```

---

## Reglas de SEO

### Keywords
- **Keyword principal**: Debe aparecer en H1, primer párrafo, al menos 1 H2, último párrafo, y meta description.
- **Keywords secundarias** (3-5): Distribuidas naturalmente a lo largo del texto. No forzar.
- **Densidad**: La keyword principal debe representar ~1-2% del texto total. Si se siente forzada, hay demasiada.
- **Long tail**: Priorizá keywords long tail (3-5 palabras) sobre keywords genéricas. "automatización para PYMEs" > "automatización".

### Cómo elegir la keyword principal
1. Mirá el tema más fuerte del corpus de la semana
2. Pensá: ¿qué buscaría en Google alguien interesado en este tema?
3. La keyword debe ser:
   - Relevante al expertise del cliente
   - Buscada por su audiencia objetivo
   - Alcanzable (no competir con gigantes por keywords genéricas)

### Estructura técnica
- **H1**: Solo uno por artículo. Es el título.
- **H2**: Para cada sección principal. 3-5 por artículo.
- **H3**: Solo si una sección H2 necesita subdivisiones (no obligatorio).
- **Párrafos**: Máximo 4 oraciones. Preferible 2-3.
- **Listas**: Usá bullet points o listas numeradas cuando mejoren la legibilidad.
- **Links internos**: Si el cliente tiene blog previo, sugerí links a artículos relacionados.

---

## Longitud

- **Artículo estándar**: 800-1200 palabras
- **Artículo largo/pilar**: 1500-2000 palabras (solo cuando el tema lo justifica)
- **No rellenar**: Si el tema se cubre bien en 800 palabras, no estires a 1200.

---

## Tono para blog

- **Más estructurado que redes** pero igual de humano.
- **Primera persona**: El cliente escribe desde su experiencia.
- **Educativo pero no condescendiente**: Asumí que el lector es inteligente pero no experto.
- **Con ejemplos concretos**: Cada punto abstracto necesita un ejemplo real o hipotético realista.
- **Sin relleno**: Cada párrafo debe agregar información nueva. Si se repite la idea, cortá.
- **Basado en el corpus**: El artículo debe nacer de algo que el cliente dijo, experimentó o piensa.

---

## Tipos de artículo

| Tipo | Cuándo usarlo | Estructura recomendada |
|------|--------------|----------------------|
| Guía práctica | Cuando el corpus tiene un proceso o método que el cliente domina | Paso a paso con ejemplos |
| Análisis de tendencia | Cuando el corpus tiene observaciones sobre el mercado/industria | Contexto → Análisis → Implicaciones → Acción |
| Opinión fundamentada | Cuando el cliente tiene una posición fuerte sobre algo | Tesis → Argumentos → Contra-argumento → Conclusión |
| Caso de estudio | Cuando hay una historia de éxito con un cliente | Problema → Solución → Resultados → Aprendizajes |
| Lista curada | Cuando el corpus tiene múltiples puntos sobre un tema | Intro → N puntos → Conclusión |

---

## Proceso de generación

1. Leé el corpus de la semana y el brand_voice
2. Identificá el tema más fuerte para un artículo de blog (que tenga profundidad suficiente)
3. Definí keyword principal y secundarias
4. Elegí el tipo de artículo más adecuado
5. Escribí la estructura (H1, H2s) antes del contenido
6. Desarrollá cada sección asegurándote de incluir ejemplos concretos
7. Escribí la meta description al final (cuando tenés claro el contenido)
8. Revisá densidad de keywords — si suena forzado, relajá
9. Verificá que la longitud esté en rango (800-1200 palabras)

---

## Formato de entrega

```markdown
# Blog — Artículo Semanal [YYYY-MM-DD]

**Tema del corpus**: [tema que origina el artículo]
**Tipo de artículo**: [guía / análisis / opinión / caso / lista]
**Keyword principal**: [keyword]
**Keywords secundarias**: [keyword 2], [keyword 3], [keyword 4]
**Longitud**: [N] palabras
**Meta description**: [155 chars máximo]

---

[ARTÍCULO COMPLETO]

---

**Notas para el operador**:
- Sugerencias de imagen destacada
- Links internos sugeridos (si el cliente tiene blog previo)
- Plataformas donde republicar (Medium, LinkedIn articles, etc.)
```

Guardá en: `/outputs/content/blog/YYYY-MM-DD_blog_article.md`
