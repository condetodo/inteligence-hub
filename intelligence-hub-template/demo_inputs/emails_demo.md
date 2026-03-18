# Emails — Bandeja de Martín (Semana del 2026-03-09)

---

## Email 1: Propuesta a nuevo cliente

**De**: Martín <martin@autopymetech.com>
**Para**: Carlos Mendoza <cmendoza@transportesrm.com.ar>
**Asunto**: Propuesta de automatización — Transportes RM
**Fecha**: 2026-03-09

Hola Carlos,

Fue un gusto hablar el jueves. Te mando la propuesta como quedamos.

**Contexto**: Tu equipo administrativo dedica ~4 horas diarias a procesar remitos, cruzar con facturación y actualizar la planilla de entregas. Con 12 camiones activos, cada error de carga manual puede costar entre $50K y $200K ARS en re-entregas.

**Lo que proponemos**:
1. Automatizar la carga de remitos vía escaneo (foto con celular → dato en el sistema)
2. Cruce automático remito-factura con alertas de discrepancia
3. Dashboard en tiempo real de estado de entregas
4. Reportes semanales automáticos para vos

**Inversión**: USD 450/mes (plan PYME, incluye soporte prioritario)
**Implementación**: 2-3 semanas
**ROI estimado**: Recuperás la inversión en el primer mes solo con las horas que ahorrás.

Si te sirve, agendamos una demo esta semana con tu equipo de administración así ven cómo funciona en la práctica.

Abrazo,
Martín

PD: Te adjunto un caso de estudio de una distribuidora similar que implementó esto el mes pasado. Los números hablan solos.

---

## Email 2: Seguimiento a cliente en España

**De**: Martín <martin@autopymetech.com>
**Para**: Laura Giménez <laura.gimenez@logisticasur.es>
**Asunto**: Re: Integración SAP — Propuesta visual
**Fecha**: 2026-03-11

Hola Laura,

Como te comenté por WhatsApp, te mando la propuesta para la integración con SAP Business One.

En lugar de mandarte un PDF de 30 páginas, preparé un flowchart interactivo que muestra exactamente cómo quedaría el flujo: desde la orden de compra en SAP hasta la factura automática en vuestro sistema de logística.

Puntos clave:
- No tocamos SAP. Nos conectamos vía API y leemos/escribimos datos sin modificar nada de la configuración actual.
- Implementación en 4 semanas (es un poco más que lo estándar por la complejidad de SAP).
- Soporte dedicado en horario europeo durante los primeros 2 meses.
- Inversión: EUR 800/mes (incluye la integración SAP como módulo adicional).

Lo que necesitaría de vuestro lado: acceso a la documentación de la API de SAP que tenéis implementada y un contacto técnico para las pruebas de integración.

¿Nos vemos el jueves a las 10:00 CET para repasar el flowchart juntos antes de la reunión de dirección del viernes?

Un saludo,
Martín

---

## Email 3: Respuesta a consulta sobre IA

**De**: Martín <martin@autopymetech.com>
**Para**: Newsletter de founders (lista privada)
**Asunto**: Re: ¿Alguien está usando IA en producto?
**Fecha**: 2026-03-10

Buenas,

Respondo al thread porque es un tema que me tiene la cabeza dando vueltas.

Nosotros todavía no metimos IA en el producto, pero estoy investigando dos casos de uso concretos:

1. **Predicción de demanda para inventario**: La idea es que el sistema le diga a una PYME "vas a necesitar comprar X cantidad de Y producto en Z días" basándose en el histórico. Suena simple pero el impacto es enorme — las PYMEs o compran de más (plata muerta en stock) o compran de menos (pierden ventas).

2. **Clasificación automática de tickets de soporte**: Que el sistema categorice y priorice los tickets antes de que un humano los vea. Esto nos ayudaría internamente y también podríamos ofrecerlo como feature.

Lo que me frena: no quiero ser el que mete IA por moda y después no funciona bien. La confianza de nuestros clientes se basa en que lo que entregamos funciona el día 1. Si meto un modelo que predice mal, pierdo más de lo que gano.

Mi approach: voy a empezar con un piloto cerrado con 3-4 clientes de retail que tienen buen volumen de datos. Si funciona, lo lanzo como beta. Si no, lo mato sin que nadie se entere.

¿Alguno ya pasó por esto? Me interesa especialmente si usaron modelos pre-entrenados o entrenaron algo propio.

Martín

---

## Email 4: Respuesta a cliente insatisfecho

**De**: Martín <martin@autopymetech.com>
**Para**: Roberto Sánchez <roberto@ferreteriaelsol.com.ar>
**Asunto**: Re: Caída del sistema — Plan de acción
**Fecha**: 2026-03-12

Roberto,

Ante todo, disculpas de nuevo por las caídas. Entiendo la frustración y no te voy a dar excusas.

Te cuento qué estamos haciendo para que no pase más:

1. **Migración de servidores** (esta semana): Estamos moviendo toda la infraestructura a un proveedor con 99.95% de uptime garantizado. La migración la hacemos de noche para que no afecte tu operación.

2. **Sistema de alertas proactivo** (implementado ayer): Ahora recibimos alertas cuando el uso de CPU o memoria supera el 80%, ANTES de que el sistema se caiga. Podemos actuar preventivamente.

3. **Servidor de respaldo** (próxima semana): Vamos a tener un segundo servidor que entra automáticamente si el principal falla. Tiempo de conmutación: menos de 60 segundos.

4. **Tu compensación**: El próximo mes es sin cargo. Y a partir de ahora, si el sistema tiene más de 30 minutos de downtime en un mes, te descuento proporcional automáticamente. Lo pongo por escrito.

Roberto, tu feedback es de las cosas más valiosas que tengo. Me ayuda a construir un producto más robusto. Gracias por la paciencia y por ser directo.

Abrazo,
Martín

---

## Email 5: Interno al equipo

**De**: Martín <martin@autopymetech.com>
**Para**: equipo@autopymetech.com
**Asunto**: Objetivos Q2 + reflexión
**Fecha**: 2026-03-13

Equipo,

Esta semana llegamos a 47 clientes activos. Cuando empezamos hace 14 meses, el objetivo era llegar a 50 el primer año. Estamos a 3 de esa meta, con 2 meses de adelanto.

Pero no nos relajemos. Los próximos 50 van a ser más difíciles que los primeros 50, y la competencia no se va a quedar mirando.

**Objetivos Q2 (abril-junio)**:

1. **Llegar a 80 clientes** (33 nuevos en 3 meses)
2. **España**: 10 clientes activos en el mercado español (hoy tenemos 3)
3. **Churn**: Mantener churn mensual por debajo del 3%
4. **Infraestructura**: Completar migración + redundancia. Cero caídas en Q2.
5. **Producto**: Lanzar beta de predicción de demanda con 3-4 clientes piloto

**Reflexión personal**: Estamos en un momento bisagra. Somos lo suficientemente grandes para que nos tomen en serio y lo suficientemente chicos para movernos rápido. Esa es nuestra ventaja. No la perdamos.

Cada uno de ustedes es clave. No estamos construyendo una empresa que necesita 200 personas — estamos construyendo una que funciona brillantemente con pocas personas y mucha automatización. Comemos nuestra propia comida.

El lunes repasamos esto en la daily.

Martín
