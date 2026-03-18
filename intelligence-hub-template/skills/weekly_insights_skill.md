# Skill: Weekly Insights — Reporte de Inteligencia Semanal

> Este es el skill diferencial del sistema. Genera un reporte de inteligencia accionable sobre el cliente que va más allá de resumir — interpreta, conecta puntos y propone acciones.

---

## Qué es este reporte

El Weekly Insights es un análisis estratégico semanal que combina:
- Lo que el corpus builder procesó esta semana
- El historial acumulado en brand_voice.md
- Las instrucciones analíticas de insights_extractor.md

El resultado es un documento que el operador puede usar para:
1. Entender rápidamente en qué está el cliente
2. Preparar la próxima sesión con preguntas inteligentes
3. Ajustar la estrategia de contenido
4. Detectar oportunidades que el cliente no ve

---

## Inputs necesarios

Antes de generar el reporte, leé en este orden:
1. `/system/brand_voice.md` — contexto completo del cliente
2. `/system/insights_extractor.md` — instrucciones de análisis (seguirlas rigurosamente)
3. El corpus de esta semana: `/outputs/insights/YYYY-MM-DD_corpus_resumen.md`
4. Insights de semanas anteriores en `/outputs/insights/` (para comparar evolución)

---

## Estructura del reporte

```markdown
# Weekly Insights — [Nombre del cliente] — Semana del [YYYY-MM-DD]

---

## Resumen ejecutivo

[Máximo 5 líneas. Lo esencial de esta semana en un vistazo.
Qué pasó, qué cambió, qué importa. Un ejecutivo ocupado debería
poder leer solo esto y entender el estado del cliente.]

---

## Top 3 temas de esta semana

### 1. [Tema principal]
**Por qué importa**: [1-2 oraciones]
**Evidencia del corpus**:
- [Cita o referencia 1]
- [Cita o referencia 2]
**Implicación para contenido**: [cómo se traduce esto en contenido]
**Implicación para negocio**: [cómo afecta a la estrategia del cliente]

### 2. [Segundo tema]
[Mismo formato]

### 3. [Tercer tema]
[Mismo formato]

---

## Oportunidad destacada

**Qué**: [Descripción concreta de la oportunidad]
**Por qué ahora**: [Qué del corpus sugiere que es el momento]
**Evidencia**: [Qué dijo o hizo el cliente que revela esta oportunidad]
**Acción recomendada**: [Paso concreto y específico]
**Riesgo de no actuar**: [Qué pasa si no se aprovecha]

---

## Evolución del posicionamiento

**Semana anterior**: [Cómo estaba posicionado / qué temas dominaban]
**Esta semana**: [Qué cambió]
**Tendencia**: [⬆ Fortaleciendo / ➡ Estable / ⬇ Debilitando / ↔ Pivoteando]
**Recomendación**: [Ajuste sugerido al posicionamiento, si corresponde]

_Nota: Si es la primera semana, describir el punto de partida y qué se espera construir._

---

## Contenido que resonó más

_Esta sección se completa cuando hay datos de engagement de semanas anteriores._

**Post con mejor performance**: [plataforma + tema + métrica]
**Por qué funcionó**: [hipótesis basada en el contenido y el timing]
**Aprendizaje**: [qué replicar la próxima semana]

_Si no hay datos de engagement aún, incluir:_
**Predicción**: De los contenidos generados esta semana, el que tiene mayor potencial de resonar es [X] porque [razón basada en el corpus y la audiencia].

---

## Recomendación para la próxima semana

### Contenido
- **Tema a priorizar**: [tema + por qué]
- **Plataforma a priorizar**: [plataforma + por qué]
- **Formato sugerido**: [tipo de contenido + por qué]

### Estrategia
- **Acción de negocio sugerida**: [algo concreto que el cliente debería hacer fuera del contenido]
- **Persona a contactar**: [si del corpus surge alguien con quien debería hablar]
- **Tema a explorar en la próxima sesión**: [para profundizar inputs]

---

## 3 preguntas para la sesión con el cliente

Estas preguntas están diseñadas para la próxima sesión de recolección de inputs. Son específicas al momento actual del cliente.

1. **[Pregunta 1]**
   - _Razón_: [por qué es importante preguntar esto ahora]
   - _Lo que buscamos_: [qué tipo de información esperamos obtener]

2. **[Pregunta 2]**
   - _Razón_: [por qué es importante]
   - _Lo que buscamos_: [qué información esperamos]

3. **[Pregunta 3]**
   - _Razón_: [por qué es importante]
   - _Lo que buscamos_: [qué información esperamos]

---

## Señales para monitorear

_Cosas que surgieron esta semana y vale la pena seguir en las próximas._

- [ ] [Señal 1]: [descripción + por qué monitorear]
- [ ] [Señal 2]: [descripción + por qué monitorear]
- [ ] [Señal 3]: [descripción + por qué monitorear]

---

## Metadata del reporte

- **Inputs procesados**: [cantidad y tipo]
- **Período cubierto**: [fechas]
- **Semanas acumuladas de análisis**: [número]
- **Confianza del análisis**: [alta / media / baja — depende de la calidad y cantidad de inputs]
```

---

## Reglas de generación

1. **Seguí las instrucciones de `insights_extractor.md` al pie de la letra.** Ese documento define las dimensiones de análisis. Esta skill define la estructura de salida.
2. **Evidencia siempre.** Cada afirmación debe estar respaldada por algo del corpus. Sin evidencia, no se incluye.
3. **Accionable siempre.** Si un insight no tiene una acción asociada, no se incluye.
4. **Comparar con semanas anteriores** cuando haya historial. La evolución es más valiosa que la foto estática.
5. **Ser honesto con la confianza.** Si los inputs de la semana fueron escasos o superficiales, decilo. Un análisis con poca data es peor que decir "necesitamos más inputs".
6. **El resumen ejecutivo se escribe al final**, después de completar todo el análisis.

---

## Formato de entrega

Guardá el reporte completo en: `/outputs/insights/YYYY-MM-DD_weekly_insights.md`

Después de generar, actualizá la sección "Historial de insights" en `/system/brand_voice.md` con un resumen de esta semana.
