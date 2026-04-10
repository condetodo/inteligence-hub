"""
Generates a PDF overview of the Intelligence Hub agent system.

Run: python docs/exports/build_agents_overview_pdf.py

Output: docs/exports/agents-overview.pdf
"""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT = Path(__file__).parent / "agents-overview.pdf"

# ---------- Styles ----------
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleCustom",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=22,
    textColor=colors.HexColor("#111111"),
    spaceAfter=6,
    alignment=TA_LEFT,
)

subtitle_style = ParagraphStyle(
    "Subtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=11,
    textColor=colors.HexColor("#666666"),
    spaceAfter=20,
    alignment=TA_LEFT,
)

h1_style = ParagraphStyle(
    "H1Custom",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=16,
    textColor=colors.HexColor("#111111"),
    spaceBefore=18,
    spaceAfter=10,
)

h2_style = ParagraphStyle(
    "H2Custom",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=13,
    textColor=colors.HexColor("#333333"),
    spaceBefore=14,
    spaceAfter=8,
)

body_style = ParagraphStyle(
    "BodyCustom",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#222222"),
    spaceAfter=8,
    alignment=TA_LEFT,
)

bullet_style = ParagraphStyle(
    "BulletCustom",
    parent=body_style,
    leftIndent=14,
    bulletIndent=2,
    spaceAfter=4,
)

code_style = ParagraphStyle(
    "CodeCustom",
    parent=styles["Code"],
    fontName="Courier",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#222222"),
    backColor=colors.HexColor("#F4F4F4"),
    borderColor=colors.HexColor("#D0D0D0"),
    borderWidth=0.5,
    borderPadding=6,
    leftIndent=0,
    rightIndent=0,
)

table_header_bg = colors.HexColor("#111111")
table_header_fg = colors.white
table_row_alt = colors.HexColor("#F7F7F7")
table_border = colors.HexColor("#CCCCCC")


def make_table(headers, rows, col_widths):
    data = [headers] + rows
    # wrap cell contents in Paragraphs so they flow within columns
    wrapped = []
    for r, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if r == 0:
                p = Paragraph(
                    f'<font color="white"><b>{cell}</b></font>',
                    ParagraphStyle(
                        "TH",
                        parent=body_style,
                        fontName="Helvetica-Bold",
                        fontSize=9.5,
                        textColor=colors.white,
                        leading=12,
                    ),
                )
            else:
                p = Paragraph(
                    cell,
                    ParagraphStyle(
                        "TD",
                        parent=body_style,
                        fontSize=9,
                        leading=12,
                        spaceAfter=0,
                    ),
                )
            wrapped_row.append(p)
        wrapped.append(wrapped_row)

    tbl = Table(wrapped, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), table_header_bg),
                ("TEXTCOLOR", (0, 0), (-1, 0), table_header_fg),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, table_row_alt]),
                ("LINEBELOW", (0, 0), (-1, 0), 0.75, colors.black),
                ("GRID", (0, 1), (-1, -1), 0.25, table_border),
            ]
        )
    )
    return tbl


# ---------- Content ----------
story = []

# Cover
story.append(Paragraph("Intelligence Hub", title_style))
story.append(
    Paragraph(
        "Sistema de Agentes: inventario y flujo de trabajo - Abril 2026",
        subtitle_style,
    )
)

story.append(
    Paragraph(
        "Este documento describe la totalidad de agentes presentes en el backend "
        "de Intelligence Hub al 10 de abril de 2026, su rol individual en el "
        "pipeline de procesamiento semanal y la secuencia exacta de ejecucion "
        "disparada por el boton Procesar en la UI.",
        body_style,
    )
)

# Totals
story.append(Paragraph("Cantidad total", h1_style))
story.append(
    Paragraph(
        "El directorio <font face='Courier'>intelligence-hub-api/src/agents/</font> contiene "
        "<b>11 archivos</b>, distribuidos asi:",
        body_style,
    )
)
story.append(Paragraph("&bull; <b>9 agentes activos</b> (8 usan LLM, 1 es mecanico)", bullet_style))
story.append(
    Paragraph(
        "&bull; <b>1 dispatcher</b> (<font face='Courier'>contentOrchestrator</font>) que "
        "coordina los 4 agentes de contenido pero no llama LLM",
        bullet_style,
    )
)
story.append(
    Paragraph(
        "&bull; <b>1 dead code</b> (<font face='Courier'>brandVoice.ts</font>) reemplazado por "
        "distillation en el Digital Twin Phase 1; marcado en ROADMAP para limpieza",
        bullet_style,
    )
)
story.append(
    Paragraph(
        "Ademas de estos archivos, existe el <b>orchestrator top-level</b> ubicado en "
        "<font face='Courier'>src/orchestrator.ts</font> que conduce todo el pipeline de "
        "principio a fin, llamando a cada agente en el orden correcto.",
        body_style,
    )
)

# Pipeline agents
story.append(Paragraph("Agentes de pipeline", h1_style))
story.append(
    Paragraph(
        "Cuatro agentes que forman la columna vertebral del procesamiento. Transforman "
        "inputs crudos en conocimiento estructurado y evaluan la salida final.",
        body_style,
    )
)

pipeline_rows = [
    [
        "1. Corpus Builder",
        "Opus 4.6",
        "Procesa los inputs en bruto (conversaciones, notas, emails del periodo) y los "
        "destila en un corpus estructurado: summary, topics, decisions, concerns, "
        "opportunities, mentions (personas y empresas). Es la lectura de realidad del periodo.",
    ],
    [
        "2. Distillation",
        "Opus 4.6",
        "Actualiza el Digital Twin (Knowledge Base). Lee el perfil base actual mas el "
        "corpus nuevo y actualiza topics, contacts, narratives, insightHistory. Respeta "
        "los lockedFields y staticFieldsLocked. Reemplazo al agente brandVoice en el "
        "Horse Workflow Evolution.",
    ],
    [
        "3. Insights",
        "Opus 4.6",
        "Genera el reporte de inteligencia semanal: executive summary, top topics con "
        "analisis de tendencia, oportunidad principal, evolucion de marca, preguntas "
        "estrategicas y recomendaciones. Recibe el KB completo (perfil base mas ultimos "
        "N periodos de memoria activa).",
    ],
    [
        "4. Consistency Checker",
        "Sonnet 4.6",
        "Evalua cada borrador generado contra la identidad de marca. Da un score del 1 "
        "al 10 mas notas por pieza mirando tono, audiencia, posicionamiento, identidad y "
        "diversidad versus posts aprobados recientes. Es el unico agente que opera sobre "
        "drafts ya generados.",
    ],
]
story.append(
    make_table(
        ["Agente", "Modelo", "Rol"],
        pipeline_rows,
        col_widths=[4.2 * cm, 2.3 * cm, 10.0 * cm],
    )
)

# Content agents
story.append(Paragraph("Agentes de contenido", h1_style))
story.append(
    Paragraph(
        "Cuatro agentes especializados, uno por plataforma. Todos corren en paralelo "
        "bajo Opus 4.6, coordinados por <font face='Courier'>contentOrchestrator</font>.",
        body_style,
    )
)

content_rows = [
    [
        "5. LinkedIn Agent",
        "Opus 4.6",
        "N posts por variantes A/B/C, cada uno con titulo interno, image prompt y hook. "
        "Tipos: thought leadership, case study, framework.",
    ],
    [
        "6. X (Twitter) Agent",
        "Opus 4.6",
        "N tweets independientes mas 1 hilo de 5 a 8 tweets. Respeta limite de 280 "
        "caracteres. Incluye image prompt para el hilo.",
    ],
    [
        "7. Blog Agent",
        "Opus 4.6",
        "1 articulo completo de 800 a 1200 palabras con titulo, subtitulo, secciones H2, "
        "conclusion y keywords SEO.",
    ],
    [
        "8. TikTok Agent",
        "Opus 4.6",
        "N guiones de 60 a 90 segundos con hook (primeros 3 seg), desarrollo con "
        "indicaciones de camara entre corchetes, CTA y thumbnail prompt.",
    ],
]
story.append(
    make_table(
        ["Agente", "Modelo", "Output"],
        content_rows,
        col_widths=[4.2 * cm, 2.3 * cm, 10.0 * cm],
    )
)

# Mechanical agent
story.append(Paragraph("Agente mecanico", h1_style))
story.append(
    Paragraph(
        "<b>9. Distribution</b> (sin LLM, solo SQL). Cuenta el contenido generado y lo "
        "marca como DRAFT para revision manual. Es un placeholder MVP con TODOs en el "
        "codigo para integrar con Notion, Gmail drafts, Buffer y Slack. Hoy solo "
        "contabiliza.",
        body_style,
    )
)

# contentOrchestrator
story.append(Paragraph("El contentOrchestrator (dispatcher, no agente)", h1_style))
story.append(
    Paragraph(
        "<font face='Courier'>agents/contentOrchestrator.ts</font> no es un agente. Es "
        "un coordinador que arma el bundle de contexto y dispara los 4 agentes de "
        "contenido en paralelo. No habla con ningun LLM directamente.",
        body_style,
    )
)

orchestrator_steps = [
    "Carga el brand voice y el corpus del periodo actual",
    "Carga los ultimos N periodos (memoria activa) para pasarlos a los agentes",
    "Carga los strategic docs marcados como foundational",
    "Carga las configs de plataforma (cuantos posts por canal)",
    "Carga los benchmarks de posts aprobados con seleccion diversa (3 por plataforma)",
    "Carga la config de estilo por plataforma (sliders mas instrucciones del usuario)",
    "Genera el humanizationContext por plataforma (capa anti-patrones de escritura AI)",
    "Borra los drafts viejos de la semana actual",
    "Aplica el filtro de plataformas elegido en el modal de procesamiento",
    "Dispatcha los 4 agentes de contenido en paralelo con Promise.all",
]
for s in orchestrator_steps:
    story.append(Paragraph(f"&bull; {s}", bullet_style))

story.append(PageBreak())

# Pipeline flow
story.append(Paragraph("Flujo completo del pipeline", h1_style))
story.append(
    Paragraph(
        "Top-level: <font face='Courier'>runOrchestrator(instanceId, runId)</font> en "
        "<font face='Courier'>src/orchestrator.ts</font>. La secuencia de ejecucion es "
        "la siguiente:",
        body_style,
    )
)

pipeline_diagram = """\
+------------------------------------------------------------------+
|                    runOrchestrator()                             |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
| Step 1: Corpus Builder                          [Opus 4.6]       |
| Lee los InputFile del periodo actual                             |
| Extrae estructura semantica                                      |
| --> guarda WeeklyCorpus                                          |
+------------------------------------------------------------------+
                           |
               (si no hay corpus, termina el run)
                           v
+------------------------------------------------------------------+
| Step 2: Distillation                            [Opus 4.6]       |
| Actualiza el Digital Twin (BrandVoice)                           |
| Respeta lockedFields y staticFieldsLocked                        |
| --> actualiza BrandVoice in-place                                |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
| Step 2.5: Brand Voice Snapshot                  [sin LLM]        |
| Congela el KB actualizado para historico por semana              |
| --> guarda BrandVoiceSnapshot                                    |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
| Step 3: Content + Insights (en paralelo)        [Opus 4.6]       |
|                                                                  |
|   +-----------------------------+   +----------------------+     |
|   | contentOrchestrator         |   | Insights             |     |
|   |                             |   |                      |     |
|   |   +--> LinkedIn             |   | --> guarda           |     |
|   |   +--> X                    |   |     InsightReport    |     |
|   |   +--> Blog                 |   |                      |     |
|   |   +--> TikTok               |   |                      |     |
|   |                             |   +----------------------+     |
|   | --> guarda ContentOutput como DRAFT                          |
|   +-----------------------------+                                |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
| Step 3.5: Consistency Check                     [Sonnet 4.6]     |
| Scorea cada draft del 1 al 10 versus Brand Voice                 |
| Incluye check de diversidad vs posts aprobados                   |
| --> actualiza consistencyScore y consistencyNotes                |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
| Step 4: Distribution                            [sin LLM]        |
| MVP: cuenta los drafts y los marca como DRAFT                    |
| Placeholder para futuras integraciones:                          |
|   Notion / Gmail drafts / Buffer / Slack                         |
+------------------------------------------------------------------+
                           |
                           v
                       COMPLETED
"""
story.append(Preformatted(pipeline_diagram, code_style))

# Data flow table
story.append(Paragraph("Datos que viajan entre agentes", h1_style))
story.append(
    Paragraph(
        "Cada paso consume y produce estructuras especificas. La tabla muestra los "
        "inputs clave, outputs clave y la tabla Prisma donde se persisten.",
        body_style,
    )
)

data_rows = [
    [
        "Corpus Builder",
        "InputFile[] del periodo",
        "summary, topics, decisions, concerns, opportunities",
        "WeeklyCorpus",
    ],
    [
        "Distillation",
        "WeeklyCorpus + BrandVoice actual",
        "Campos actualizados del KB",
        "BrandVoice (in-place)",
    ],
    [
        "BV Snapshot",
        "BrandVoice actualizado",
        "Copia congelada por semana",
        "BrandVoiceSnapshot",
    ],
    [
        "Content (x4)",
        "BV + Corpus + recentCorpuses + strategicDocs + benchmark + styleConfig + "
        "humanizationContext + processingModalConfig",
        "Posts, tweets, articulos, scripts",
        "ContentOutput (DRAFT)",
    ],
    [
        "Insights",
        "BV + Corpus + recentCorpuses",
        "Reporte semanal estructurado",
        "InsightReport",
    ],
    [
        "Consistency",
        "ContentOutput drafts + BV + ultimos aprobados",
        "Score y notes por draft",
        "ContentOutput.consistencyScore/Notes",
    ],
    [
        "Distribution",
        "ContentOutput drafts + InsightReport",
        "Count y status",
        "Solo log por ahora",
    ],
]
story.append(
    make_table(
        ["Paso", "Input clave", "Output clave", "Tabla Prisma"],
        data_rows,
        col_widths=[3.2 * cm, 5.5 * cm, 4.3 * cm, 3.5 * cm],
    )
)

# Observations
story.append(Paragraph("Observaciones importantes", h1_style))

observations = [
    (
        "Paralelismo real",
        "Step 3 corre Content + Insights con <font face='Courier'>Promise.all</font>. "
        "Dentro de Content, los 4 agentes de plataforma tambien van en "
        "<font face='Courier'>Promise.all</font>. En un run tipico pueden estar 5 "
        "requests a Anthropic corriendo simultaneamente.",
    ),
    (
        "Tolerancia a fallos escalonada",
        "Si el Corpus Builder no produce nada y no hay corpus previo, el run termina "
        "limpio con status COMPLETED. Si Content o Insights fallan, se loggea, se marca "
        "el step como failed pero el run sigue. Si Consistency falla, se loggea y sigue "
        "a Distribution. Si Distillation o Distribution fallan, tira excepcion y marca "
        "el run entero como FAILED.",
    ),
    (
        "Memoria activa (Digital Twin)",
        "Los agentes Content e Insights reciben los ultimos N periodos de corpus, "
        "configurable via <font face='Courier'>instance.activeWindow</font> (default "
        "8). Esto les da contexto historico para que las piezas nuevas no contradigan "
        "lo anterior y construyan continuidad.",
    ),
    (
        "Dos fuentes de voz",
        "BrandVoice estatica (protegida por staticFieldsLocked): identity, "
        "valueProposition, audience, voiceTone, positioning, metrics, recurringTopics. "
        "Editada por el equipo, no modificada por AI. KB dinamico: topics, contacts, "
        "narratives. Actualizada automaticamente por Distillation, con lock individual "
        "opcional.",
    ),
    (
        "Consistency es el unico reactor",
        "Es el unico agente que reacciona a output de otros agentes en el mismo run. "
        "Todos los demas reciben solo corpus, KB y configs.",
    ),
]
for title, body in observations:
    story.append(Paragraph(f"<b>{title}.</b> {body}", body_style))

# Footer note
story.append(Spacer(1, 18))
story.append(
    Paragraph(
        "<i>Generado automaticamente desde el codigo actual en main "
        "(commit c9a9eb4 o posterior).</i>",
        ParagraphStyle(
            "Footer",
            parent=body_style,
            fontSize=8.5,
            textColor=colors.HexColor("#888888"),
        ),
    )
)


# ---------- Build ----------
doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=2 * cm,
    rightMargin=2 * cm,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
    title="Intelligence Hub - Agentes y Flujo de Trabajo",
    author="Intelligence Hub",
)
doc.build(story)
print(f"PDF generated: {OUTPUT}")
print(f"Size: {OUTPUT.stat().st_size} bytes")
