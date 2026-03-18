import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('horse2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'francisco@horseconsulting.io' },
    update: {},
    create: {
      email: 'francisco@horseconsulting.io',
      password: hashedPassword,
      name: 'Francisco Perez',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create Francisco's instance
  const instance = await prisma.instance.create({
    data: {
      name: 'Francisco P.',
      clientName: 'Francisco Perez',
      clientRole: 'Cofounder',
      company: 'Uanaknow / Horse Consulting',
      industry: 'Technology Consulting & AI Implementation',
      users: { create: { userId: admin.id } },
      brandVoice: {
        create: {
          identity: 'Francisco Perez, Cofounder de Uanaknow y Horse Consulting. Experto en implementacion de IA en PyMEs y empresas medianas/grandes. Mezcla assessment estrategico con ejecucion tactica.',
          valueProposition: 'Ayudo a empresas a adoptar IA de forma practica - no teoria, no humo, implementacion real que mejora procesos, eficiencia y resultados. Combino vision estrategica con capacidad de ejecucion tecnica.',
          audience: 'CEOs y directores de operaciones de PyMEs y empresas medianas que saben que necesitan IA pero no saben por donde empezar. Empresas que no tienen miedo al cambio y quieren iterar.',
          voiceTone: {
            adjectives: ['directo', 'estructurado', 'tecnico pero accesible', 'calido', 'sin rodeos'],
            examples: [
              'Creo que lo mejor va a ser una reunion de re-group.',
              'Haciendo un poco de autocritica creo que en lo personal no estoy cumpliendo.',
              'De paso te dejo lo que me tiro Claude sobre los puntos a validar del proyecto.',
              'Abrazo de gol academico.',
            ],
            neverSay: [
              'Sinergia', 'Disruptivo', 'Paradigma', 'Leverage',
              'Cualquier buzzword vacio sin sustancia',
            ],
          },
          recurringTopics: [
            'Implementacion practica de IA en empresas',
            'Automatizacion de procesos con multi-agentes',
            'Mejora continua basada en performance de IA',
            'Adopcion tecnologica en PyMEs',
            'Equipos multidisciplinarios para transformacion digital',
            'Escalar operaciones sin contratar proporcionalmente',
          ],
          positioning: 'Ser reconocido como el referente en implementacion real de IA para empresas - no el que habla de IA en abstracto, sino el que la pone a funcionar en procesos reales con resultados medibles.',
          metrics: 'Clientes activos, proyectos implementados, eficiencia ganada por cliente, contenido publicado con engagement real.',
          insightHistory: [],
        },
      },
    },
  });
  console.log('Created instance:', instance.name);

  // Create demo WhatsApp inputs
  const whatsappInputs = [
    {
      filename: 'whatsapp_cliente_logistica.md',
      content: `**Chat con Marcos - Dir. Operaciones, LogiPack**
Fecha: 10 Mar 2026

Francisco: Marcos, te mando el resumen de lo que hablamos. Basicamente hay 3 puntos donde la IA puede entrar ya: clasificacion de pedidos, ruteo de entregas y prediccion de demanda. Lo mas rapido de implementar es la clasificacion.

Marcos: Perfecto. La clasificacion manual nos esta matando, tenemos 2 personas full time haciendo eso.

Francisco: Exacto. Con un modelo bien entrenado lo resolves en tiempo real. Te armo una PoC esta semana y la probamos con data real.

Marcos: Dale, te paso acceso al sistema manana.

Francisco: Genial. Una cosa - no arranquemos por todo. Hagamos clasificacion, medimos impacto, y despues vamos por ruteo. Paso a paso.

Marcos: Me gusta. Asi se lo puedo vender al directorio sin que se asusten.`,
    },
    {
      filename: 'whatsapp_socio_justi.md',
      content: `**Chat con Justiniano - Cofounder, Uanaknow**
Fecha: 11 Mar 2026

Francisco: Justi, estuve pensando en el tema Horse. Creo que el Intelligence Hub puede ser un producto en si mismo. No solo para nosotros, para venderlo.

Justiniano: Como seria?

Francisco: Armamos la plataforma, la probamos con nuestros clientes, y despues la vendemos como SaaS. El cliente sube su material (whatsapps, mails, notas) y el sistema le genera contenido + insights automaticamente.

Justiniano: Me gusta. Pero no nos dispersamos?

Francisco: No si lo hacemos bien. Horse es el caso de uso. Intelligence Hub es el producto. Primero lo usamos nosotros, despues lo vendemos. Mismo approach que con UanaCall.

Justiniano: True. Dale, arma el MVP y lo probamos.

Francisco: Ya estoy en eso. Te muestro algo la semana que viene. Abrazo.`,
    },
    {
      filename: 'whatsapp_prospect_farmacia.md',
      content: `**Chat con Laura - Gerente Comercial, FarmaRed**
Fecha: 12 Mar 2026

Laura: Hola Francisco, nos recomendo Marcos de LogiPack. Tenemos un problema con el stock de las sucursales, siempre nos falta o nos sobra.

Francisco: Hola Laura! Si, Marcos me comento. Mira, ese es un caso clasico de prediccion de demanda. Cuantas sucursales tienen?

Laura: 34 en todo el pais.

Francisco: OK. La solucion no es compleja pero necesito entender bien el flujo. Tienen data historica de ventas por sucursal?

Laura: Si, como 5 anos de data.

Francisco: Perfecto, con eso sobra. Te propongo algo: hacemos una call de 30 min esta semana, me mostras el sistema que usan, y yo te digo honestamente si tiene sentido usar IA o si hay una solucion mas simple primero.

Laura: Me encanta que digas eso. Otros nos vendieron soluciones carisimas sin preguntar nada.

Francisco: Es que a veces la solucion no es IA, es un Excel bien armado. Pero cuando si es IA, el impacto es enorme. Coordinamos?`,
    },
    {
      filename: 'whatsapp_equipo_interno.md',
      content: `**Grupo Horse Team**
Fecha: 13 Mar 2026

Francisco: Equipo, update semanal. Tenemos 3 deals activos:
1. LogiPack - PoC de clasificacion arranca esta semana
2. FarmaRed - call de discovery el jueves
3. Vanadis - esperando feedback del presupuesto

Ademas estoy construyendo el Intelligence Hub que va a ser nuestro producto core. Les muestro demo la semana que viene.

Ana: Genial! Necesitas algo de diseno para el demo?

Francisco: Si, necesito que el dashboard se vea profesional. Te paso el mockup que tengo y lo mejoramos.

Cristian: Yo puedo ayudar con el backend si necesitas.

Francisco: Por ahora estoy con Claude pero la semana que viene seguro necesito pair programming para las integraciones. Gracias!`,
    },
    {
      filename: 'whatsapp_personal_papa.md',
      content: `**Chat con Papa**
Fecha: 9 Mar 2026

Francisco: Pa, como estas? Todo bien por ahi?

Papa: Todo bien hijo. Tu madre pregunta cuando venis a comer.

Francisco: Este finde voy. El sabado almuerzo?

Papa: Dale. Tu hermana viene tambien. Como va el laburo?

Francisco: Bien, mucho. Estoy armando un producto nuevo que puede ser grande. Basicamente uso inteligencia artificial para generar contenido y analisis para empresas.

Papa: No entiendo mucho pero suena bien. Mientras pague las cuentas...

Francisco: Jaja si, pa. Paga y va a pagar mas. El sabado les explico. Abrazo grande.`,
    },
  ];

  for (const input of whatsappInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'WHATSAPP', ...input },
    });
  }
  console.log(`Created ${whatsappInputs.length} WhatsApp inputs`);

  // Create demo email inputs
  const emailInputs = [
    {
      filename: 'email_propuesta_logipack.md',
      content: `**De:** Francisco Perez <francisco@horseconsulting.io>
**Para:** Marcos Delgado <marcos@logipack.com>
**Asunto:** Propuesta PoC - Clasificacion Inteligente de Pedidos
**Fecha:** 10 Mar 2026

Marcos,

Como hablamos, te dejo la propuesta para la PoC de clasificacion de pedidos.

**Objetivo:** Automatizar la clasificacion manual de pedidos usando un modelo de IA entrenado con su data historica.

**Alcance:**
1. Analisis de data existente (1 semana)
2. Entrenamiento del modelo con datos historicos (1 semana)
3. Integracion con el sistema actual via API (1 semana)
4. Testing y ajustes con el equipo de operaciones (1 semana)

**Inversion:** USD 4.500 por la PoC completa (4 semanas)
**Resultado esperado:** Reduccion del 80% del tiempo manual de clasificacion.

Si los resultados son positivos, la siguiente fase seria ruteo inteligente de entregas.

Quedo atento.
Abrazo,
Francisco`,
    },
    {
      filename: 'email_seguimiento_vanadis.md',
      content: `**De:** Francisco Perez <francisco@horseconsulting.io>
**Para:** Manuel Castro <manuel@vanadis.com>
**CC:** Justiniano Vila <justiniano@uanaknow.com>
**Asunto:** Re: Seguimiento propuesta app movil
**Fecha:** 12 Mar 2026

Manuel,

Te hago un seguimiento de la propuesta que te mandamos hace 2 semanas. Entiendo que estos procesos llevan su tiempo, pero queria saber si tienen alguna duda o si necesitan que ajustemos algo.

Puntos clave de la propuesta:
- App movil offline-first para comerciales de campo
- Sincronizacion automatica cuando hay conexion
- CMS para gestion de contenido multi-marca
- Timeline estimado: 12 semanas

Si necesitas una call rapida para resolver dudas, decime y coordinamos.

Abrazo,
Francisco`,
    },
    {
      filename: 'email_post_call_farmared.md',
      content: `**De:** Francisco Perez <francisco@horseconsulting.io>
**Para:** Laura Mendez <laura@farmared.com>
**Asunto:** Resumen call + proximos pasos - FarmaRed
**Fecha:** 13 Mar 2026

Laura,

Gracias por la call de hoy. Te resumo lo que hablamos y los proximos pasos.

**Diagnostico:**
- El problema principal es la falta de prediccion de demanda por sucursal
- Tienen 5 anos de data limpia en su ERP - excelente punto de partida
- El sobre-stock les cuesta aprox. 15% del margen bruto
- El quiebre de stock les genera perdida de clientes en las sucursales mas chicas

**Mi recomendacion:**
Antes de ir a IA, primero necesitamos limpiar y estructurar la data. Despues, un modelo de prediccion por categoria de producto + sucursal.

**Proximos pasos:**
1. Me pasan acceso de lectura al ERP (esta semana)
2. Yo hago un analisis exploratorio de la data (1 semana)
3. Les presento hallazgos + propuesta formal

Sin compromiso hasta el paso 3. Si la data no da, se los digo honestamente.

Abrazo,
Francisco`,
    },
  ];

  for (const input of emailInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'EMAIL', ...input },
    });
  }
  console.log(`Created ${emailInputs.length} email inputs`);

  // Create demo note inputs
  const noteInputs = [
    {
      filename: 'nota_idea_producto.md',
      content: `**Nota: Ideas para Intelligence Hub**
Fecha: 8 Mar 2026

El sistema tiene que resolver un problema real: las empresas de consulting/marketing gastan demasiado tiempo entendiendo al cliente y generando contenido. Si automatizo eso, libero tiempo para lo que realmente importa: la estrategia.

Flujo ideal:
1. El cliente habla naturalmente (WhatsApp, calls, mails)
2. El sistema captura todo eso
3. Lo procesa y entiende quien es el cliente, que piensa, que le preocupa
4. Genera contenido en su voz autentica
5. Genera insights que ni el cliente sabia de si mismo

El diferencial vs un ChatGPT es que aca hay CONTEXTO ACUMULADO. Cada semana el sistema sabe mas del cliente. No arranca de cero cada vez.

Pricing tentativo:
- Plan Starter: 1 instancia, $500/mes
- Plan Pro: 5 instancias, $2000/mes
- Plan Agency: ilimitado, $5000/mes`,
    },
    {
      filename: 'nota_reflexion_mercado.md',
      content: `**Reflexion: El estado de la adopcion de IA en empresas**
Fecha: 11 Mar 2026

Vengo de 3 reuniones esta semana y el patron es el mismo:
- Todos saben que "tienen que hacer algo con IA"
- Nadie sabe por donde empezar
- Les da miedo gastar plata en algo que no entienden
- Las grandes consultoras les cobran fortunas por un "roadmap de IA" que es un PDF de 80 paginas que nadie lee

Ahi esta la oportunidad. No vender roadmaps, vender IMPLEMENTACION. Ir, hacer, medir, iterar.

Lo que me diferencia:
1. Se de estrategia (assessment, analisis de procesos)
2. Se de tecnologia (puedo buildear lo que propongo)
3. Se de IA (no solo usar ChatGPT, sino entender modelos, agentes, flujos)
4. Hablo el idioma del CEO y del developer

Esa combinacion es rara. Hay que explotarla.`,
    },
    {
      filename: 'nota_aprendizaje_agentes.md',
      content: `**Nota: Lo que aprendi sobre multi-agentes esta semana**
Fecha: 12 Mar 2026

Estuve experimentando con arquitecturas de multi-agentes y hay algunos aprendizajes clave:

1. No todo necesita un agente. A veces un prompt bien armado alcanza.
2. Los agentes son utiles cuando hay DECISIONES intermedias - si el flujo es lineal, no tiene sentido.
3. La comunicacion entre agentes es el cuello de botella. Hay que definir contratos claros (que le pasa un agente al otro).
4. El orquestador es el componente mas importante. Si esta mal disenado, todo se rompe.
5. Los agentes que corren en paralelo necesitan ser completamente independientes. Si comparten estado, problemas.

Aplicado al Intelligence Hub:
- Corpus Builder y Brand Voice son secuenciales (uno depende del otro)
- Content Agent e Insights Agent son paralelos (independientes)
- Distribution es el ultimo paso (depende de todos los anteriores)

El pattern es: sequential -> parallel -> sequential. Funciona.`,
    },
    {
      filename: 'nota_competencia.md',
      content: `**Nota: Analisis de competencia**
Fecha: 9 Mar 2026

Estuve mirando que hay en el mercado:

1. **Jasper AI / Copy.ai** - Generan contenido pero sin contexto de marca. Es generico. No aprenden del cliente.
2. **Lately** - Repurposea contenido largo en posts cortos. Interesante pero limitado.
3. **Taplio / AuthoredUp** - Tools para LinkedIn especificamente. Buenos pero solo una plataforma.
4. **Grandes consultoras** - Hacen analisis de marca pero manual, caro, y el entregable es un PDF.

Ninguno hace las DOS cosas: contenido + inteligencia. Y ninguno tiene el modelo de "aprendizaje continuo" que yo propongo.

El Intelligence Hub NO compite con Jasper. Compite con el servicio de una agencia de marketing - pero automatizado, mas barato, y que mejora cada semana.

Eso es el pitch.`,
    },
  ];

  for (const input of noteInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'NOTE', ...input },
    });
  }
  console.log(`Created ${noteInputs.length} note inputs`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
