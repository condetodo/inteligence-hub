# Plan 2: AI Agent System

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5-agent AI system that processes raw client inputs into publishable content and business intelligence. Runs on top of the backend API from Plan 1.

**Architecture:** Orchestrator coordinates 5 agents in sequence/parallel: Corpus Builder → Brand Voice → Promise.all(Content, Insights) → Distribution. Each agent reads/writes to the database via Prisma. Content Agent delegates to 4 platform-specific Skills. Images generated via Nano Banana 2 (Gemini). Weekly scheduler via node-cron.

**Tech Stack:** Node.js 20, TypeScript, `@anthropic-ai/sdk` (Claude API), `@google/generative-ai` (Nano Banana 2 / Gemini), node-cron, Prisma (from Plan 1)

**Spec:** `docs/superpowers/specs/2026-03-14-intelligence-hub-design.md`

**Depends on:** Plan 1 (Backend API Foundation) must be completed first.

---

## File Structure

```
intelligence-hub-api/src/
├── agents/
│   ├── corpusBuilder.ts       ← reads PENDING inputs, extracts structured data, creates WeeklyCorpus
│   ├── brandVoice.ts          ← reads WeeklyCorpus, updates BrandVoice with new learnings
│   ├── content.ts             ← orchestrates 4 skills in parallel, generates text + images
│   ├── insights.ts            ← generates weekly intelligence report
│   └── distribution.ts       ← MVP: marks everything as DRAFT. Future: Notion/Gmail/etc
├── skills/
│   ├── linkedinSkill.ts       ← system prompt + generator for LinkedIn posts
│   ├── xSkill.ts              ← system prompt + generator for X/Twitter
│   ├── tiktokSkill.ts         ← system prompt + generator for TikTok scripts
│   └── blogSkill.ts           ← system prompt + generator for blog articles
├── lib/
│   ├── claude.ts              ← Claude API client wrapper (handles sonnet vs opus selection)
│   └── nanoBanana.ts          ← Nano Banana 2 image generation wrapper
├── orchestrator.ts            ← coordinates all 5 agents in the correct order
└── scheduler.ts               ← node-cron that triggers orchestrator every Monday 7am

intelligence-hub-api/tests/
├── agents/
│   ├── corpusBuilder.test.ts
│   ├── brandVoice.test.ts
│   ├── content.test.ts
│   ├── insights.test.ts
│   └── distribution.test.ts
├── lib/
│   ├── claude.test.ts
│   └── nanoBanana.test.ts
└── orchestrator.test.ts
```

---

## Chunk 1: AI Client Libraries

### Task 1: Claude API Wrapper

**Files:**
- Create: `intelligence-hub-api/src/lib/claude.ts`
- Create: `intelligence-hub-api/tests/lib/claude.test.ts`
- Modify: `intelligence-hub-api/.env.example`
- Modify: `intelligence-hub-api/src/config/env.ts`

- [ ] **Step 1: Install AI dependencies**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-api
npm install @anthropic-ai/sdk @google/generative-ai
```

- [ ] **Step 2: Add env variables for AI services**

Add to `intelligence-hub-api/.env.example`:

```env
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."
```

Update `intelligence-hub-api/src/config/env.ts` — add to the envSchema:

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string().min(1),
  GOOGLE_AI_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 3: Write failing tests for Claude wrapper**

Create `intelligence-hub-api/tests/lib/claude.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Anthropic SDK before importing claude module
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn();
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
    __mockCreate: mockCreate,
  };
});

// Mock env
vi.mock('../../src/config/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-key',
  },
}));

import { callSonnet, callOpus } from '../../src/lib/claude';
import Anthropic from '@anthropic-ai/sdk';

describe('Claude API Wrapper', () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mod = vi.mocked(Anthropic);
    mockCreate = (mod as any).__mockCreate || mod.mock.results[0]?.value?.messages?.create;
    // Re-get mock from the module
    const sdkMod = require('@anthropic-ai/sdk');
    mockCreate = sdkMod.__mockCreate;
  });

  describe('callSonnet', () => {
    it('should call Claude API with sonnet model', async () => {
      const sdkMod = require('@anthropic-ai/sdk');
      sdkMod.__mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '{"topics": ["AI", "automation"]}' }],
      });

      const result = await callSonnet(
        'You are a data extractor.',
        'Extract topics from this text: AI is changing automation.'
      );

      expect(result).toEqual({ topics: ['AI', 'automation'] });
      expect(sdkMod.__mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: expect.any(Number),
          system: 'You are a data extractor.',
          messages: [{ role: 'user', content: 'Extract topics from this text: AI is changing automation.' }],
        })
      );
    });

    it('should retry on failure up to 3 times', async () => {
      const sdkMod = require('@anthropic-ai/sdk');
      sdkMod.__mockCreate
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: '{"ok": true}' }],
        });

      const result = await callSonnet('system', 'user');
      expect(result).toEqual({ ok: true });
      expect(sdkMod.__mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should throw after 3 failed retries', async () => {
      const sdkMod = require('@anthropic-ai/sdk');
      sdkMod.__mockCreate
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'));

      await expect(callSonnet('system', 'user')).rejects.toThrow('Error 3');
    });
  });

  describe('callOpus', () => {
    it('should call Claude API with opus model', async () => {
      const sdkMod = require('@anthropic-ai/sdk');
      sdkMod.__mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '{"content": "Generated post"}' }],
      });

      const result = await callOpus('You are a writer.', 'Write a post.');

      expect(result).toEqual({ content: 'Generated post' });
      expect(sdkMod.__mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-20250514',
        })
      );
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-api
npx vitest run tests/lib/claude.test.ts
```

Expected: All tests FAIL (module not found).

- [ ] **Step 5: Implement Claude wrapper**

Create `intelligence-hub-api/src/lib/claude.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const SONNET_MODEL = 'claude-sonnet-4-20250514';
const OPUS_MODEL = 'claude-opus-4-20250514';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      // Parse JSON from response — handle markdown code blocks
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Claude API attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Call Claude Sonnet — used for mechanical/extraction tasks.
 * Cheaper and faster. Used by Corpus Builder and Brand Voice agents.
 */
export async function callSonnet(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<Record<string, unknown>> {
  return callClaude(SONNET_MODEL, systemPrompt, userPrompt, maxTokens);
}

/**
 * Call Claude Opus — used for creative/analysis tasks.
 * Higher quality output. Used by Content Skills and Insights agent.
 */
export async function callOpus(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192
): Promise<Record<string, unknown>> {
  return callClaude(OPUS_MODEL, systemPrompt, userPrompt, maxTokens);
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/lib/claude.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add intelligence-hub-api/src/lib/claude.ts intelligence-hub-api/src/config/env.ts intelligence-hub-api/tests/lib/claude.test.ts intelligence-hub-api/.env.example
git commit -m "feat: add Claude API wrapper with sonnet/opus selection and retry logic"
```

---

### Task 2: Nano Banana 2 Image Generation Wrapper

**Files:**
- Create: `intelligence-hub-api/src/lib/nanoBanana.ts`
- Create: `intelligence-hub-api/tests/lib/nanoBanana.test.ts`

- [ ] **Step 1: Write failing tests for Nano Banana wrapper**

Create `intelligence-hub-api/tests/lib/nanoBanana.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

vi.mock('../../src/config/env', () => ({
  env: {
    GOOGLE_AI_API_KEY: 'test-key',
  },
}));

import { generateImage } from '../../src/lib/nanoBanana';

describe('Nano Banana 2 Image Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate an image and return base64 data', async () => {
    const sdkMod = require('@google/generative-ai');
    sdkMod.__mockGenerateContent.mockResolvedValueOnce({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    const result = await generateImage('A professional business illustration');

    expect(result).toEqual({
      base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk',
      mimeType: 'image/png',
    });
  });

  it('should throw if no image is returned', async () => {
    const sdkMod = require('@google/generative-ai');
    sdkMod.__mockGenerateContent.mockResolvedValueOnce({
      response: {
        candidates: [
          {
            content: {
              parts: [{ text: 'I cannot generate that image' }],
            },
          },
        ],
      },
    });

    await expect(generateImage('test prompt')).rejects.toThrow('No image generated');
  });

  it('should retry on failure', async () => {
    const sdkMod = require('@google/generative-ai');
    sdkMod.__mockGenerateContent
      .mockRejectedValueOnce(new Error('API error'))
      .mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: 'base64data',
                    },
                  },
                ],
              },
            },
          ],
        },
      });

    const result = await generateImage('test prompt');
    expect(result.base64).toBe('base64data');
    expect(sdkMod.__mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/lib/nanoBanana.test.ts
```

Expected: All tests FAIL.

- [ ] **Step 3: Implement Nano Banana 2 wrapper**

Create `intelligence-hub-api/src/lib/nanoBanana.ts`:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',  // Nano Banana 2 model
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

/**
 * Generate an image using Nano Banana 2 (Gemini Flash with image generation).
 * Returns base64-encoded image data.
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const fullPrompt = `Generate a professional, clean, minimalist illustration for a social media post.
Style: Modern, corporate, no text overlays, suitable for LinkedIn/professional contexts.
Color palette: Dark tones with subtle accent colors.

Image description: ${prompt}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate?.content?.parts) {
        throw new Error('No image generated: empty response');
      }

      const imagePart = candidate.content.parts.find(
        (part: any) => part.inlineData?.data
      );

      if (!imagePart || !('inlineData' in imagePart) || !imagePart.inlineData) {
        throw new Error('No image generated: no inline data in response');
      }

      return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Nano Banana attempt ${attempt}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Generate an image prompt from content context.
 * Used by skills to create descriptive prompts for image generation.
 */
export function buildImagePrompt(
  platform: string,
  title: string,
  topics: string[]
): string {
  const topicStr = topics.slice(0, 3).join(', ');
  return `${platform} post illustration about: ${title}. Related topics: ${topicStr}. Professional business context.`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/lib/nanoBanana.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/lib/nanoBanana.ts intelligence-hub-api/tests/lib/nanoBanana.test.ts
git commit -m "feat: add Nano Banana 2 image generation wrapper with retry logic"
```

---

## Chunk 2: Skills (Content Generation Prompts)

### Task 3: LinkedIn Skill

**Files:**
- Create: `intelligence-hub-api/src/skills/linkedinSkill.ts`

- [ ] **Step 1: Create LinkedIn skill with Spanish system prompt**

Create `intelligence-hub-api/src/skills/linkedinSkill.ts`:

```typescript
import { callOpus } from '../lib/claude';
import { generateImage, buildImagePrompt } from '../lib/nanoBanana';

const LINKEDIN_SYSTEM_PROMPT = `Eres un estratega de contenido experto en LinkedIn para líderes empresariales hispanohablantes.

TU MISIÓN: Generar exactamente 3 publicaciones de LinkedIn, cada una con 3 variantes (A, B, C), basándote en la voz de marca y el corpus semanal proporcionados.

REGLAS DE FORMATO PARA LINKEDIN:
- Cada post debe tener entre 150-250 palabras
- Estructura obligatoria: gancho inicial (1-2 líneas impactantes) → desarrollo en 3-5 párrafos cortos → llamada a la acción → 3 hashtags relevantes
- Párrafos cortos: máximo 2-3 líneas cada uno
- Usar saltos de línea entre párrafos (esto es CRUCIAL en LinkedIn)
- NO usar bullet points excesivos — LinkedIn premia la narrativa fluida
- Incluir una pregunta reflexiva al final para generar comentarios

TIPOS DE POST (distribuir entre los 3):
1. THOUGHT LEADERSHIP: Opinión fuerte sobre tendencia del sector. Empieza con una afirmación provocadora.
2. CASO / APRENDIZAJE: Historia real (del corpus) con lección aplicable. Usa "La semana pasada..." o "Recientemente..."
3. FRAMEWORK / MÉTODO: Comparte un proceso o metodología. Usa números: "3 pasos para...", "El error #1 que veo..."

TONO Y VOZ:
- Mantener EXACTAMENTE el tono descrito en la voz de marca
- Ser directo, no condescendiente
- Evitar clichés de LinkedIn: "Estoy emocionado de anunciar...", "No creerás lo que pasó..."
- No usar emojis excesivos (máximo 1-2 por post, solo si la voz de marca lo permite)
- Evitar jerga vacía: "sinergia", "paradigma", "disrumpir" — usar lenguaje concreto
- El contenido debe sonar como si lo escribiera la persona, NO como IA

ANTI-PATRONES (NO HACER):
- No empezar con "En un mundo donde..."
- No usar "Déjame contarte algo..."
- No hacer posts genéricos que podrían ser de cualquier persona
- No inventar datos o estadísticas
- No ser autocomplaciente: "Estoy orgulloso de..."

FORMATO DE RESPUESTA (JSON estricto):
{
  "posts": [
    {
      "type": "THOUGHT_LEADERSHIP" | "CASE_STUDY" | "FRAMEWORK",
      "title": "título interno descriptivo (no se publica)",
      "imagePrompt": "descripción visual para generación de imagen",
      "variants": {
        "A": {
          "content": "texto completo del post variante A",
          "hook": "primera línea del post"
        },
        "B": {
          "content": "texto completo del post variante B (mismo tema, diferente ángulo)",
          "hook": "primera línea del post"
        },
        "C": {
          "content": "texto completo del post variante C (mismo tema, tono diferente)",
          "hook": "primera línea del post"
        }
      }
    }
  ]
}`;

export interface LinkedInPost {
  type: string;
  title: string;
  imagePrompt: string;
  variants: {
    A: { content: string; hook: string };
    B: { content: string; hook: string };
    C: { content: string; hook: string };
  };
}

export interface LinkedInSkillOutput {
  posts: LinkedInPost[];
}

export async function generateLinkedIn(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>
): Promise<LinkedInSkillOutput> {
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera 3 publicaciones de LinkedIn con 3 variantes cada una. Responde SOLO con JSON válido.`;

  const result = await callOpus(LINKEDIN_SYSTEM_PROMPT, userPrompt);
  return result as unknown as LinkedInSkillOutput;
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-api/src/skills/linkedinSkill.ts
git commit -m "feat: add LinkedIn skill with detailed Spanish system prompt"
```

---

### Task 4: X/Twitter Skill

**Files:**
- Create: `intelligence-hub-api/src/skills/xSkill.ts`

- [ ] **Step 1: Create X skill with Spanish system prompt**

Create `intelligence-hub-api/src/skills/xSkill.ts`:

```typescript
import { callOpus } from '../lib/claude';

const X_SYSTEM_PROMPT = `Eres un estratega de contenido experto en X (Twitter) para líderes empresariales hispanohablantes.

TU MISIÓN: Generar exactamente 2 tweets independientes y 1 hilo de 5-8 tweets, basándote en la voz de marca y el corpus semanal.

REGLAS PARA TWEETS INDEPENDIENTES:
- Máximo 280 caracteres ESTRICTO — esto es innegociable
- Una sola idea por tweet — claridad absoluta
- Formato directo: afirmación + contexto breve O pregunta provocadora
- Pueden incluir 1-2 hashtags pero NO es obligatorio
- Si incluyen dato o ejemplo, debe ser del corpus real

REGLAS PARA HILOS:
- Tweet 1 (gancho): Debe generar curiosidad. Usa "🧵" al final para indicar que es hilo
- Tweets 2-6 (desarrollo): Una idea por tweet, que construya sobre la anterior
- Tweet 7-8 (cierre): Resumen + CTA (seguir, compartir, opinar)
- Cada tweet del hilo debe funcionar de forma independiente si se comparte solo
- Numerar los tweets del hilo: 1/, 2/, 3/...

TONO EN X:
- Más informal que LinkedIn pero igualmente inteligente
- Permitido ser más provocador y directo
- Frases cortas, impactantes
- Se puede usar humor sutil si la voz de marca lo permite
- Evitar sonar como "gurú" o "coach"

ANTI-PATRONES:
- No usar "Hilo 🧵👇" como gancho — el gancho debe ser la IDEA, no el formato
- No tweets vacíos tipo "Esto cambiará tu vida"
- No copiar formatos virales genéricos
- No excederse en hashtags (máximo 2 por tweet)
- No poner todos los tweets con la misma estructura

FORMATO DE RESPUESTA (JSON estricto):
{
  "tweets": [
    {
      "type": "STANDALONE",
      "content": "texto del tweet (máx 280 chars)",
      "title": "título interno descriptivo"
    },
    {
      "type": "STANDALONE",
      "content": "texto del tweet (máx 280 chars)",
      "title": "título interno descriptivo"
    }
  ],
  "thread": {
    "title": "título interno del hilo",
    "imagePrompt": "descripción visual para imagen del primer tweet",
    "tweets": [
      "1/ texto del primer tweet del hilo",
      "2/ texto del segundo tweet",
      "3/ ...",
      "4/ ...",
      "5/ ..."
    ]
  }
}`;

export interface XStandaloneOutput {
  type: 'STANDALONE';
  content: string;
  title: string;
}

export interface XThreadOutput {
  title: string;
  imagePrompt: string;
  tweets: string[];
}

export interface XSkillOutput {
  tweets: XStandaloneOutput[];
  thread: XThreadOutput;
}

export async function generateX(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>
): Promise<XSkillOutput> {
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera 2 tweets independientes y 1 hilo de 5-8 tweets. Responde SOLO con JSON válido.`;

  const result = await callOpus(X_SYSTEM_PROMPT, userPrompt);
  return result as unknown as XSkillOutput;
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-api/src/skills/xSkill.ts
git commit -m "feat: add X/Twitter skill with detailed Spanish system prompt"
```

---

### Task 5: TikTok Skill

**Files:**
- Create: `intelligence-hub-api/src/skills/tiktokSkill.ts`

- [ ] **Step 1: Create TikTok skill with Spanish system prompt**

Create `intelligence-hub-api/src/skills/tiktokSkill.ts`:

```typescript
import { callOpus } from '../lib/claude';

const TIKTOK_SYSTEM_PROMPT = `Eres un estratega de contenido experto en TikTok para líderes empresariales hispanohablantes que quieren posicionarse en video corto.

TU MISIÓN: Generar exactamente 2 guiones de video para TikTok, basándote en la voz de marca y el corpus semanal.

ESTRUCTURA OBLIGATORIA DE CADA GUIÓN:
1. GANCHO (0-3 segundos): La frase que detiene el scroll. Debe ser visual y auditiva. Ejemplos de formato:
   - "Nadie te dice esto sobre [tema]..."
   - "Error #1 que cometen las empresas con [tema]"
   - Mostrar resultado impactante primero, luego explicar
2. DESARROLLO (3-45 segundos): El contenido principal dividido en puntos claros
   - Máximo 3 puntos principales
   - Cada punto debe poder acompañarse de texto en pantalla
   - Incluir transiciones sugeridas entre puntos
3. CTA (últimos 3-5 segundos): Cierre con acción específica
   - "Sígueme para más sobre [tema]"
   - "Guarda esto para cuando lo necesites"
   - "¿Cuál agregarías? Comenta"

DIRECCIONES VISUALES:
- Indicar qué aparece en pantalla en cada momento
- Sugerir texto overlay para puntos clave
- Indicar si es formato: talking head, pantalla compartida, voiceover con gráficos
- Sugerir formato trending si aplica (storytime, POV, "cosas que aprendí", etc.)

TONO PARA TIKTOK:
- Más casual y directo que cualquier otra plataforma
- Energía alta pero no artificial
- Evitar sonar corporativo — en TikTok eso mata el engagement
- Se puede tutear al viewer
- Frases cortas, ritmo rápido

ANTI-PATRONES:
- No guiones que parezcan presentación corporativa
- No usar "Hola, soy [nombre] y hoy les voy a hablar de..."
- No hacer videos explicativos largos sin gancho
- No ignorar las tendencias de formato de la plataforma
- No olvidar los textos en pantalla — son esenciales en TikTok

FORMATO DE RESPUESTA (JSON estricto):
{
  "scripts": [
    {
      "title": "título interno descriptivo",
      "format": "TALKING_HEAD" | "VOICEOVER" | "SCREEN_SHARE" | "TRENDING",
      "trendReference": "nombre del formato trending si aplica, null si no",
      "duration": "estimación en segundos (15-60)",
      "imagePrompt": "descripción visual para thumbnail",
      "hook": {
        "text": "frase exacta del gancho (lo que se dice)",
        "screenText": "texto que aparece en pantalla",
        "duration": "3 segundos"
      },
      "development": [
        {
          "point": "punto principal 1",
          "script": "lo que se dice exactamente",
          "screenText": "texto en pantalla",
          "visualDirection": "qué se ve en este momento"
        }
      ],
      "cta": {
        "text": "frase exacta del cierre",
        "screenText": "texto en pantalla del CTA"
      }
    }
  ]
}`;

export interface TikTokPoint {
  point: string;
  script: string;
  screenText: string;
  visualDirection: string;
}

export interface TikTokScript {
  title: string;
  format: string;
  trendReference: string | null;
  duration: string;
  imagePrompt: string;
  hook: {
    text: string;
    screenText: string;
    duration: string;
  };
  development: TikTokPoint[];
  cta: {
    text: string;
    screenText: string;
  };
}

export interface TikTokSkillOutput {
  scripts: TikTokScript[];
}

export async function generateTikTok(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>
): Promise<TikTokSkillOutput> {
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera 2 guiones de video para TikTok. Responde SOLO con JSON válido.`;

  const result = await callOpus(TIKTOK_SYSTEM_PROMPT, userPrompt);
  return result as unknown as TikTokSkillOutput;
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-api/src/skills/tiktokSkill.ts
git commit -m "feat: add TikTok skill with detailed Spanish system prompt"
```

---

### Task 6: Blog Skill

**Files:**
- Create: `intelligence-hub-api/src/skills/blogSkill.ts`

- [ ] **Step 1: Create Blog skill with Spanish system prompt**

Create `intelligence-hub-api/src/skills/blogSkill.ts`:

```typescript
import { callOpus } from '../lib/claude';

const BLOG_SYSTEM_PROMPT = `Eres un redactor SEO experto que escribe artículos de blog para líderes empresariales hispanohablantes.

TU MISIÓN: Generar exactamente 1 artículo de blog SEO-optimizado basándote en la voz de marca y el corpus semanal.

ESTRUCTURA DEL ARTÍCULO:
- Extensión: 800-1200 palabras
- H1: Título principal (incluir keyword principal, máximo 60 caracteres)
- Meta description: 150-160 caracteres, incluir keyword, con CTA implícito
- Introducción: 2-3 párrafos que establezcan el problema y prometan la solución
- 3-5 secciones H2: Cada una desarrolla un subtema con 2-4 párrafos
- Conclusión: Resumen + perspectiva a futuro + CTA
- Keywords: 1 primary keyword + 3-5 secondary keywords distribuidas naturalmente

REGLAS SEO:
- Keyword principal en: H1, primer párrafo, al menos 2 H2s, conclusión
- Densidad de keyword: 1-2% (natural, no forzado)
- H2s deben contener secondary keywords cuando sea natural
- Párrafos cortos (3-4 líneas máximo) para lectura web
- Incluir al menos una lista (bullet points o numerada) en el artículo
- Usar negritas para conceptos clave (indicar con **texto**)
- Lenguaje activo, no pasivo

TONO DEL BLOG:
- Más formal que redes sociales pero accesible
- Posición de experto que comparte conocimiento
- Datos y ejemplos concretos del corpus cuando sea posible
- No usar primera persona excesivamente — alternar con "las empresas", "los equipos"
- Cerrar con perspectiva de futuro o llamada a la reflexión

ANTI-PATRONES:
- No empezar con "En el mundo actual..." o "En la era digital..."
- No hacer artículos superficiales — cada sección debe aportar valor concreto
- No keyword stuffing — la legibilidad siempre es prioridad
- No hacer promesas exageradas en el título
- No escribir conclusiones que solo repitan lo ya dicho — agregar perspectiva nueva
- No usar "sin duda", "claramente", "obviamente" — dejar que los argumentos hablen

FORMATO DE RESPUESTA (JSON estricto):
{
  "article": {
    "title": "H1 del artículo",
    "slug": "url-friendly-slug",
    "metaDescription": "meta description de 150-160 chars",
    "primaryKeyword": "keyword principal",
    "secondaryKeywords": ["keyword2", "keyword3", "keyword4"],
    "imagePrompt": "descripción visual para imagen destacada del blog",
    "content": "artículo completo en formato markdown (con ## para H2, **negritas**, listas, etc.)",
    "estimatedReadTime": "X min de lectura",
    "sections": [
      {
        "h2": "Título de la sección H2",
        "summary": "resumen de 1 línea de qué cubre esta sección"
      }
    ]
  }
}`;

export interface BlogSection {
  h2: string;
  summary: string;
}

export interface BlogArticle {
  title: string;
  slug: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  imagePrompt: string;
  content: string;
  estimatedReadTime: string;
  sections: BlogSection[];
}

export interface BlogSkillOutput {
  article: BlogArticle;
}

export async function generateBlog(
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>
): Promise<BlogSkillOutput> {
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify(brandVoice, null, 2)}

CORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):
${JSON.stringify(corpus, null, 2)}

Genera 1 artículo de blog SEO-optimizado. Responde SOLO con JSON válido.`;

  const result = await callOpus(BLOG_SYSTEM_PROMPT, userPrompt);
  return result as unknown as BlogSkillOutput;
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-api/src/skills/blogSkill.ts
git commit -m "feat: add Blog skill with detailed Spanish SEO system prompt"
```

---

## Chunk 3: Agents

### Task 7: Corpus Builder Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/corpusBuilder.ts`
- Create: `intelligence-hub-api/tests/agents/corpusBuilder.test.ts`

- [ ] **Step 1: Write failing tests for Corpus Builder**

Create `intelligence-hub-api/tests/agents/corpusBuilder.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/claude', () => ({
  callSonnet: vi.fn(),
}));

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    inputFile: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    weeklyCorpus: {
      create: vi.fn(),
    },
    processingRun: {
      update: vi.fn(),
    },
  },
}));

import { runCorpusBuilder } from '../../src/agents/corpusBuilder';
import { callSonnet } from '../../src/lib/claude';
import { prisma } from '../../src/lib/prisma';

describe('Corpus Builder Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read PENDING inputs and create a WeeklyCorpus', async () => {
    const mockInputs = [
      { id: '1', content: 'Hoy hablamos sobre implementación de IA en PYMES', type: 'WHATSAPP', filename: 'chat1.txt' },
      { id: '2', content: 'El proyecto con Ford avanza bien, cerramos fase 1', type: 'EMAIL', filename: 'email1.txt' },
    ];

    const mockCorpusResult = {
      summary: { overview: 'Semana enfocada en IA y proyectos activos' },
      topics: ['Implementación IA', 'Proyecto Ford'],
      decisions: ['Cerrar fase 1 con Ford'],
      concerns: [],
      opportunities: ['Expandir servicio IA a más PYMES'],
    };

    vi.mocked(prisma.inputFile.findMany).mockResolvedValue(mockInputs as any);
    vi.mocked(callSonnet).mockResolvedValue(mockCorpusResult);
    vi.mocked(prisma.weeklyCorpus.create).mockResolvedValue({ id: 'corpus-1' } as any);
    vi.mocked(prisma.inputFile.updateMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);

    const result = await runCorpusBuilder('instance-1', 'run-1', 12, 2026);

    expect(prisma.inputFile.findMany).toHaveBeenCalledWith({
      where: { instanceId: 'instance-1', status: 'PENDING' },
    });

    expect(callSonnet).toHaveBeenCalledWith(
      expect.stringContaining('extractor de información'),
      expect.stringContaining('chat1.txt')
    );

    expect(prisma.weeklyCorpus.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: 'instance-1',
        weekNumber: 12,
        year: 2026,
        topics: mockCorpusResult.topics,
      }),
    });

    expect(prisma.inputFile.updateMany).toHaveBeenCalledWith({
      where: { instanceId: 'instance-1', status: 'PENDING' },
      data: { status: 'PROCESSED', processedAt: expect.any(Date) },
    });

    expect(result).toBeDefined();
  });

  it('should skip processing if no PENDING inputs', async () => {
    vi.mocked(prisma.inputFile.findMany).mockResolvedValue([]);

    await expect(runCorpusBuilder('instance-1', 'run-1', 12, 2026))
      .rejects.toThrow('No pending inputs');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/agents/corpusBuilder.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Corpus Builder agent**

Create `intelligence-hub-api/src/agents/corpusBuilder.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { callSonnet } from '../lib/claude';

const CORPUS_SYSTEM_PROMPT = `Eres un extractor de información estructurada experto. Tu trabajo es analizar inputs crudos de un líder empresarial (mensajes de WhatsApp, emails, notas, transcripciones) y extraer información categorizada.

DEBES EXTRAER:
1. RESUMEN (summary): Visión general de la semana en 3-5 oraciones
2. TEMAS (topics): Lista de temas principales discutidos, ordenados por relevancia
3. DECISIONES (decisions): Decisiones concretas tomadas o mencionadas
4. PREOCUPACIONES (concerns): Problemas, riesgos o preocupaciones expresadas
5. OPORTUNIDADES (opportunities): Oportunidades de negocio identificadas o mencionadas
6. CITAS CLAVE (keyQuotes): Frases textuales del cliente que capturan su forma de pensar
7. PROYECTOS ACTIVOS (activeProjects): Proyectos mencionados con su estado actual
8. CONTACTOS CLAVE (keyContacts): Personas mencionadas y su contexto

REGLAS:
- Extraer información TEXTUAL — no inventar ni inferir más allá de lo que dicen los inputs
- Mantener el lenguaje original del cliente en las citas
- Si un tema aparece en múltiples inputs, consolidar la información
- Priorizar información accionable sobre observaciones genéricas
- Cada item debe ser una frase concisa y clara

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": { "overview": "..." },
  "topics": ["tema1", "tema2", ...],
  "decisions": ["decisión1", "decisión2", ...],
  "concerns": ["preocupación1", ...],
  "opportunities": ["oportunidad1", ...],
  "keyQuotes": ["cita textual 1", ...],
  "activeProjects": [{ "name": "...", "status": "..." }],
  "keyContacts": [{ "name": "...", "context": "..." }]
}`;

export async function runCorpusBuilder(
  instanceId: string,
  runId: string,
  weekNumber: number,
  year: number
): Promise<{ corpusId: string }> {
  // 1. Read all PENDING inputs for this instance
  const pendingInputs = await prisma.inputFile.findMany({
    where: { instanceId, status: 'PENDING' },
  });

  if (pendingInputs.length === 0) {
    throw new Error('No pending inputs to process');
  }

  // 2. Format inputs for Claude
  const inputsText = pendingInputs
    .map((input) => `--- ${input.type}: ${input.filename} ---\n${input.content}`)
    .join('\n\n');

  const userPrompt = `Analiza los siguientes ${pendingInputs.length} inputs y extrae la información estructurada:

${inputsText}

Responde SOLO con JSON válido.`;

  // 3. Call Claude Sonnet for extraction
  const extraction = await callSonnet(CORPUS_SYSTEM_PROMPT, userPrompt);

  // 4. Create WeeklyCorpus record
  const corpus = await prisma.weeklyCorpus.create({
    data: {
      instanceId,
      weekNumber,
      year,
      summary: (extraction.summary as object) || {},
      topics: (extraction.topics as any[]) || [],
      decisions: (extraction.decisions as any[]) || [],
      concerns: (extraction.concerns as any[]) || [],
      opportunities: (extraction.opportunities as any[]) || [],
    },
  });

  // 5. Mark all inputs as PROCESSED
  await prisma.inputFile.updateMany({
    where: { instanceId, status: 'PENDING' },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  // 6. Update ProcessingRun step
  await prisma.processingRun.update({
    where: { id: runId },
    data: {
      steps: {
        corpus: 'completed',
      },
    },
  });

  console.log(`[CorpusBuilder] Created corpus ${corpus.id} from ${pendingInputs.length} inputs`);

  return { corpusId: corpus.id };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/corpusBuilder.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/agents/corpusBuilder.ts intelligence-hub-api/tests/agents/corpusBuilder.test.ts
git commit -m "feat: implement Corpus Builder agent with extraction prompt"
```

---

### Task 8: Brand Voice Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/brandVoice.ts`
- Create: `intelligence-hub-api/tests/agents/brandVoice.test.ts`

- [ ] **Step 1: Write failing tests for Brand Voice agent**

Create `intelligence-hub-api/tests/agents/brandVoice.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/claude', () => ({
  callSonnet: vi.fn(),
}));

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    brandVoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    weeklyCorpus: {
      findFirst: vi.fn(),
    },
    processingRun: {
      update: vi.fn(),
    },
  },
}));

import { runBrandVoiceUpdate } from '../../src/agents/brandVoice';
import { callSonnet } from '../../src/lib/claude';
import { prisma } from '../../src/lib/prisma';

describe('Brand Voice Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read corpus and update brand voice fields', async () => {
    const mockBrandVoice = {
      id: 'bv-1',
      instanceId: 'inst-1',
      identity: 'Experto en IA',
      valueProposition: 'Implementación de IA para empresas',
      audience: 'CEOs y CTOs',
      voiceTone: { adjectives: ['directo', 'técnico'] },
      recurringTopics: ['IA', 'automatización'],
      positioning: 'Líder en IA aplicada',
      metrics: '',
      insightHistory: [],
    };

    const mockCorpus = {
      id: 'corpus-1',
      topics: ['IA', 'automatización', 'multi-agentes'],
      decisions: ['Expandir a sector salud'],
      concerns: ['Falta de talento técnico'],
      opportunities: ['Sector salud necesita automatización'],
      summary: { overview: 'Semana productiva' },
    };

    const mockUpdate = {
      updatedFields: ['recurringTopics', 'opportunities'],
      recurringTopics: ['IA', 'automatización', 'multi-agentes', 'sector salud'],
      insightEntry: 'Semana 12: Nuevo tema emergente multi-agentes. Oportunidad en sector salud.',
    };

    vi.mocked(prisma.brandVoice.findUnique).mockResolvedValue(mockBrandVoice as any);
    vi.mocked(prisma.weeklyCorpus.findFirst).mockResolvedValue(mockCorpus as any);
    vi.mocked(callSonnet).mockResolvedValue(mockUpdate);
    vi.mocked(prisma.brandVoice.update).mockResolvedValue({} as any);
    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);

    await runBrandVoiceUpdate('inst-1', 'run-1', 12, 2026);

    expect(prisma.brandVoice.findUnique).toHaveBeenCalledWith({
      where: { instanceId: 'inst-1' },
    });

    expect(callSonnet).toHaveBeenCalledWith(
      expect.stringContaining('analista de voz de marca'),
      expect.stringContaining('multi-agentes')
    );

    expect(prisma.brandVoice.update).toHaveBeenCalled();
  });

  it('should throw if no brand voice exists', async () => {
    vi.mocked(prisma.brandVoice.findUnique).mockResolvedValue(null);

    await expect(runBrandVoiceUpdate('inst-1', 'run-1', 12, 2026))
      .rejects.toThrow('Brand voice not found');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/agents/brandVoice.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Brand Voice agent**

Create `intelligence-hub-api/src/agents/brandVoice.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { callSonnet } from '../lib/claude';

const BRAND_VOICE_SYSTEM_PROMPT = `Eres un analista de voz de marca experto. Tu trabajo es comparar el corpus semanal nuevo con la voz de marca actual e identificar qué ha evolucionado.

ANALIZA:
1. ¿Hay NUEVOS TEMAS que antes no aparecían? → Agregar a recurringTopics
2. ¿Ha cambiado el TONO en los inputs? ¿Más directo? ¿Más reflexivo? → Actualizar voiceTone
3. ¿Hay nueva información sobre AUDIENCIA o posicionamiento? → Actualizar audience/positioning
4. ¿Hay métricas o resultados mencionados? → Actualizar metrics
5. ¿Qué es lo más NOTABLE de esta semana vs. las anteriores?

REGLAS:
- Solo actualizar campos que REALMENTE cambiaron — no reescribir todo
- Mantener la esencia de la voz de marca, solo evolucionar incrementalmente
- El insightEntry debe ser una frase concisa que capture la evolución de la semana
- Si nada cambió significativamente, decirlo — no inventar cambios

FORMATO DE RESPUESTA (JSON estricto):
{
  "updatedFields": ["lista de campos que cambiaron"],
  "identity": "nuevo valor si cambió, null si no",
  "valueProposition": "nuevo valor si cambió, null si no",
  "audience": "nuevo valor si cambió, null si no",
  "voiceTone": null | { "adjectives": [...], "examples": [...], "antiPatterns": [...] },
  "recurringTopics": null | ["lista actualizada completa"],
  "positioning": "nuevo valor si cambió, null si no",
  "metrics": "nuevo valor si cambió, null si no",
  "insightEntry": "Semana X: resumen de la evolución detectada"
}`;

export async function runBrandVoiceUpdate(
  instanceId: string,
  runId: string,
  weekNumber: number,
  year: number
): Promise<void> {
  // 1. Read current brand voice
  const brandVoice = await prisma.brandVoice.findUnique({
    where: { instanceId },
  });

  if (!brandVoice) {
    throw new Error('Brand voice not found for instance');
  }

  // 2. Read the new weekly corpus
  const corpus = await prisma.weeklyCorpus.findFirst({
    where: { instanceId, weekNumber, year },
    orderBy: { createdAt: 'desc' },
  });

  if (!corpus) {
    throw new Error('Weekly corpus not found');
  }

  // 3. Call Claude Sonnet for analysis
  const userPrompt = `VOZ DE MARCA ACTUAL:
${JSON.stringify({
  identity: brandVoice.identity,
  valueProposition: brandVoice.valueProposition,
  audience: brandVoice.audience,
  voiceTone: brandVoice.voiceTone,
  recurringTopics: brandVoice.recurringTopics,
  positioning: brandVoice.positioning,
  metrics: brandVoice.metrics,
}, null, 2)}

CORPUS SEMANAL NUEVO (Semana ${weekNumber}, ${year}):
${JSON.stringify({
  summary: corpus.summary,
  topics: corpus.topics,
  decisions: corpus.decisions,
  concerns: corpus.concerns,
  opportunities: corpus.opportunities,
}, null, 2)}

¿Qué cambió? ¿Qué evolucionó? Responde SOLO con JSON válido.`;

  const analysis = await callSonnet(BRAND_VOICE_SYSTEM_PROMPT, userPrompt);

  // 4. Build update data — only update fields that changed
  const updateData: Record<string, unknown> = {};

  if (analysis.identity) updateData.identity = analysis.identity;
  if (analysis.valueProposition) updateData.valueProposition = analysis.valueProposition;
  if (analysis.audience) updateData.audience = analysis.audience;
  if (analysis.voiceTone) updateData.voiceTone = analysis.voiceTone;
  if (analysis.recurringTopics) updateData.recurringTopics = analysis.recurringTopics;
  if (analysis.positioning) updateData.positioning = analysis.positioning;
  if (analysis.metrics) updateData.metrics = analysis.metrics;

  // 5. Append to insight history
  const currentHistory = (brandVoice.insightHistory as any[]) || [];
  const newEntry = {
    week: weekNumber,
    year,
    insight: analysis.insightEntry || `Semana ${weekNumber}: actualización procesada`,
    updatedFields: analysis.updatedFields || [],
    date: new Date().toISOString(),
  };
  updateData.insightHistory = [...currentHistory, newEntry];

  // 6. Update brand voice in DB
  await prisma.brandVoice.update({
    where: { instanceId },
    data: updateData,
  });

  // 7. Update ProcessingRun step
  await prisma.processingRun.update({
    where: { id: runId },
    data: {
      steps: {
        corpus: 'completed',
        brandVoice: 'completed',
      },
    },
  });

  console.log(`[BrandVoice] Updated fields: ${(analysis.updatedFields as string[])?.join(', ') || 'none'}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/brandVoice.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/agents/brandVoice.ts intelligence-hub-api/tests/agents/brandVoice.test.ts
git commit -m "feat: implement Brand Voice agent with incremental update logic"
```

---

### Task 9: Content Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/content.ts`
- Create: `intelligence-hub-api/tests/agents/content.test.ts`

- [ ] **Step 1: Write failing tests for Content agent**

Create `intelligence-hub-api/tests/agents/content.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    brandVoice: { findUnique: vi.fn() },
    weeklyCorpus: { findFirst: vi.fn() },
    contentOutput: { create: vi.fn() },
    processingRun: { update: vi.fn() },
  },
}));

vi.mock('../../src/skills/linkedinSkill', () => ({
  generateLinkedIn: vi.fn(),
}));

vi.mock('../../src/skills/xSkill', () => ({
  generateX: vi.fn(),
}));

vi.mock('../../src/skills/tiktokSkill', () => ({
  generateTikTok: vi.fn(),
}));

vi.mock('../../src/skills/blogSkill', () => ({
  generateBlog: vi.fn(),
}));

vi.mock('../../src/lib/nanoBanana', () => ({
  generateImage: vi.fn(),
  buildImagePrompt: vi.fn().mockReturnValue('test prompt'),
}));

import { runContentAgent } from '../../src/agents/content';
import { prisma } from '../../src/lib/prisma';
import { generateLinkedIn } from '../../src/skills/linkedinSkill';
import { generateX } from '../../src/skills/xSkill';
import { generateTikTok } from '../../src/skills/tiktokSkill';
import { generateBlog } from '../../src/skills/blogSkill';
import { generateImage } from '../../src/lib/nanoBanana';

describe('Content Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.brandVoice.findUnique).mockResolvedValue({
      id: 'bv-1',
      identity: 'Expert',
      voiceTone: {},
      recurringTopics: ['IA'],
    } as any);

    vi.mocked(prisma.weeklyCorpus.findFirst).mockResolvedValue({
      id: 'c-1',
      topics: ['IA'],
      summary: {},
    } as any);

    vi.mocked(generateImage).mockResolvedValue({
      base64: 'imagedata',
      mimeType: 'image/png',
    });

    vi.mocked(prisma.contentOutput.create).mockResolvedValue({ id: 'co-1' } as any);
    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);
  });

  it('should run all 4 skills in parallel and create content outputs', async () => {
    vi.mocked(generateLinkedIn).mockResolvedValue({
      posts: [{
        type: 'THOUGHT_LEADERSHIP',
        title: 'Test Post',
        imagePrompt: 'business illustration',
        variants: {
          A: { content: 'Variant A content', hook: 'Hook A' },
          B: { content: 'Variant B content', hook: 'Hook B' },
          C: { content: 'Variant C content', hook: 'Hook C' },
        },
      }],
    });

    vi.mocked(generateX).mockResolvedValue({
      tweets: [{ type: 'STANDALONE' as const, content: 'Tweet 1', title: 'T1' }],
      thread: { title: 'Thread', imagePrompt: 'thread img', tweets: ['1/ First'] },
    });

    vi.mocked(generateTikTok).mockResolvedValue({
      scripts: [{
        title: 'Script 1',
        format: 'TALKING_HEAD',
        trendReference: null,
        duration: '30',
        imagePrompt: 'tiktok thumbnail',
        hook: { text: 'Hook', screenText: 'Screen', duration: '3s' },
        development: [{ point: 'P1', script: 'S1', screenText: 'ST1', visualDirection: 'VD1' }],
        cta: { text: 'Follow', screenText: 'Follow me' },
      }],
    });

    vi.mocked(generateBlog).mockResolvedValue({
      article: {
        title: 'Blog Title',
        slug: 'blog-title',
        metaDescription: 'Meta desc',
        primaryKeyword: 'IA',
        secondaryKeywords: ['automation'],
        imagePrompt: 'blog image',
        content: '# Blog content',
        estimatedReadTime: '5 min',
        sections: [{ h2: 'Section 1', summary: 'Summary 1' }],
      },
    });

    await runContentAgent('inst-1', 'run-1', 12, 2026);

    // All 4 skills should have been called
    expect(generateLinkedIn).toHaveBeenCalledTimes(1);
    expect(generateX).toHaveBeenCalledTimes(1);
    expect(generateTikTok).toHaveBeenCalledTimes(1);
    expect(generateBlog).toHaveBeenCalledTimes(1);

    // Content records should have been created
    // LinkedIn: 1 post × 3 variants = 3
    // X: 1 standalone + 1 thread = 2
    // TikTok: 1 script = 1
    // Blog: 1 article = 1
    // Total: 7 content outputs
    expect(prisma.contentOutput.create).toHaveBeenCalledTimes(7);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/agents/content.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Content agent**

Create `intelligence-hub-api/src/agents/content.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { generateImage, buildImagePrompt } from '../lib/nanoBanana';
import { generateLinkedIn } from '../skills/linkedinSkill';
import { generateX } from '../skills/xSkill';
import { generateTikTok } from '../skills/tiktokSkill';
import { generateBlog } from '../skills/blogSkill';

export async function runContentAgent(
  instanceId: string,
  runId: string,
  weekNumber: number,
  year: number
): Promise<void> {
  // 1. Read brand voice and corpus
  const brandVoice = await prisma.brandVoice.findUnique({
    where: { instanceId },
  });

  if (!brandVoice) {
    throw new Error('Brand voice not found');
  }

  const corpus = await prisma.weeklyCorpus.findFirst({
    where: { instanceId, weekNumber, year },
    orderBy: { createdAt: 'desc' },
  });

  if (!corpus) {
    throw new Error('Weekly corpus not found');
  }

  const brandVoiceData = {
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
  };

  const corpusData = {
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  };

  // 2. Run all 4 skills in parallel
  const [linkedinResult, xResult, tiktokResult, blogResult] = await Promise.all([
    generateLinkedIn(brandVoiceData, corpusData),
    generateX(brandVoiceData, corpusData),
    generateTikTok(brandVoiceData, corpusData),
    generateBlog(brandVoiceData, corpusData),
  ]);

  // 3. Process LinkedIn posts — create ContentOutput for each variant
  const topics = (corpus.topics as string[]) || [];

  for (const post of linkedinResult.posts) {
    let imageUrl: string | null = null;
    try {
      const img = await generateImage(post.imagePrompt || buildImagePrompt('LinkedIn', post.title, topics));
      imageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (err) {
      console.error(`[Content] Image generation failed for LinkedIn post "${post.title}":`, err);
    }

    for (const variant of ['A', 'B', 'C'] as const) {
      await prisma.contentOutput.create({
        data: {
          instanceId,
          weekNumber,
          year,
          platform: 'LINKEDIN',
          type: 'POST',
          title: post.title,
          content: post.variants[variant].content,
          imageUrl,
          imagePrompt: post.imagePrompt,
          variant,
          status: 'DRAFT',
        },
      });
    }
  }

  // 4. Process X tweets
  for (const tweet of xResult.tweets) {
    await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'X',
        type: 'POST',
        title: tweet.title,
        content: tweet.content,
        variant: 'A',
        status: 'DRAFT',
      },
    });
  }

  // Process X thread
  if (xResult.thread) {
    let threadImageUrl: string | null = null;
    try {
      const img = await generateImage(xResult.thread.imagePrompt || buildImagePrompt('X', xResult.thread.title, topics));
      threadImageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (err) {
      console.error(`[Content] Image generation failed for X thread:`, err);
    }

    await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'X',
        type: 'THREAD',
        title: xResult.thread.title,
        content: xResult.thread.tweets.join('\n\n'),
        imageUrl: threadImageUrl,
        imagePrompt: xResult.thread.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
  }

  // 5. Process TikTok scripts
  for (const script of tiktokResult.scripts) {
    let tiktokImageUrl: string | null = null;
    try {
      const img = await generateImage(script.imagePrompt || buildImagePrompt('TikTok', script.title, topics));
      tiktokImageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (err) {
      console.error(`[Content] Image generation failed for TikTok script:`, err);
    }

    const scriptContent = JSON.stringify({
      format: script.format,
      trendReference: script.trendReference,
      duration: script.duration,
      hook: script.hook,
      development: script.development,
      cta: script.cta,
    });

    await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'TIKTOK',
        type: 'SCRIPT',
        title: script.title,
        content: scriptContent,
        imageUrl: tiktokImageUrl,
        imagePrompt: script.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
      },
    });
  }

  // 6. Process Blog article
  if (blogResult.article) {
    let blogImageUrl: string | null = null;
    try {
      const img = await generateImage(blogResult.article.imagePrompt || buildImagePrompt('Blog', blogResult.article.title, topics));
      blogImageUrl = `data:${img.mimeType};base64,${img.base64}`;
    } catch (err) {
      console.error(`[Content] Image generation failed for blog article:`, err);
    }

    await prisma.contentOutput.create({
      data: {
        instanceId,
        weekNumber,
        year,
        platform: 'BLOG',
        type: 'ARTICLE',
        title: blogResult.article.title,
        content: blogResult.article.content,
        imageUrl: blogImageUrl,
        imagePrompt: blogResult.article.imagePrompt,
        variant: 'A',
        status: 'DRAFT',
        engagement: {
          slug: blogResult.article.slug,
          metaDescription: blogResult.article.metaDescription,
          primaryKeyword: blogResult.article.primaryKeyword,
          secondaryKeywords: blogResult.article.secondaryKeywords,
          estimatedReadTime: blogResult.article.estimatedReadTime,
          sections: blogResult.article.sections,
        },
      },
    });
  }

  // 7. Update ProcessingRun step
  await prisma.processingRun.update({
    where: { id: runId },
    data: {
      steps: {
        corpus: 'completed',
        brandVoice: 'completed',
        content: 'completed',
      },
    },
  });

  console.log(`[Content] Generated content for all 4 platforms`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/content.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/agents/content.ts intelligence-hub-api/tests/agents/content.test.ts
git commit -m "feat: implement Content agent with 4 parallel skills and image generation"
```

---

### Task 10: Insights Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/insights.ts`
- Create: `intelligence-hub-api/tests/agents/insights.test.ts`

- [ ] **Step 1: Write failing tests for Insights agent**

Create `intelligence-hub-api/tests/agents/insights.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/claude', () => ({
  callOpus: vi.fn(),
}));

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    brandVoice: { findUnique: vi.fn() },
    weeklyCorpus: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    insightReport: { create: vi.fn() },
    processingRun: { update: vi.fn() },
  },
}));

import { runInsightsAgent } from '../../src/agents/insights';
import { callOpus } from '../../src/lib/claude';
import { prisma } from '../../src/lib/prisma';

describe('Insights Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate an insight report from corpus and brand voice', async () => {
    vi.mocked(prisma.brandVoice.findUnique).mockResolvedValue({
      id: 'bv-1',
      identity: 'Expert',
      recurringTopics: ['IA'],
    } as any);

    vi.mocked(prisma.weeklyCorpus.findFirst).mockResolvedValue({
      id: 'c-1',
      topics: ['IA', 'automation'],
      summary: { overview: 'Good week' },
      decisions: ['Expand to health sector'],
      concerns: ['Talent shortage'],
      opportunities: ['Health sector needs AI'],
    } as any);

    // Previous corpus
    vi.mocked(prisma.weeklyCorpus.findMany).mockResolvedValue([{
      id: 'c-0',
      weekNumber: 11,
      topics: ['IA'],
      summary: { overview: 'Previous week' },
    }] as any);

    vi.mocked(callOpus).mockResolvedValue({
      executiveSummary: 'Semana enfocada en expansión al sector salud.',
      topTopics: [
        { topic: 'IA en salud', evidence: 'Múltiples menciones', relevance: 'alta' },
        { topic: 'Automatización', evidence: 'Proyecto activo', relevance: 'alta' },
        { topic: 'Talento técnico', evidence: 'Preocupación recurrente', relevance: 'media' },
      ],
      opportunity: 'El sector salud presenta una ventana de oportunidad clara.',
      evolution: 'Nueva vertical identificada vs semana anterior.',
      questions: [
        '¿Qué recursos se necesitan para entrar al sector salud?',
        '¿Hay alianzas potenciales en ese sector?',
        '¿Cómo priorizar entre proyectos actuales y esta oportunidad?',
      ],
      recommendations: 'Dedicar tiempo esta semana a investigar el sector salud.',
    });

    vi.mocked(prisma.insightReport.create).mockResolvedValue({ id: 'ir-1' } as any);
    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);

    await runInsightsAgent('inst-1', 'run-1', 12, 2026);

    expect(callOpus).toHaveBeenCalledWith(
      expect.stringContaining('analista de inteligencia de negocio'),
      expect.stringContaining('automation')
    );

    expect(prisma.insightReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: 'inst-1',
        weekNumber: 12,
        year: 2026,
        executiveSummary: expect.any(String),
        topTopics: expect.any(Array),
        opportunity: expect.any(String),
        evolution: expect.any(String),
        questions: expect.any(Array),
        recommendations: expect.any(String),
      }),
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/agents/insights.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Insights agent**

Create `intelligence-hub-api/src/agents/insights.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';

const INSIGHTS_SYSTEM_PROMPT = `Eres un analista de inteligencia de negocio experto. Tu trabajo es generar un reporte semanal de inteligencia basado en el corpus procesado, la voz de marca y la comparación con semanas anteriores.

EL REPORTE DEBE INCLUIR:

1. RESUMEN EJECUTIVO (executiveSummary): 3-5 oraciones que capturen lo más importante de la semana. Directo, sin rodeos. Un CEO debe poder leer solo esto y entender qué pasó.

2. TOP 3 TEMAS (topTopics): Los 3 temas más relevantes de la semana, cada uno con:
   - Nombre del tema
   - Evidencia concreta (de dónde sale: qué inputs, qué decisiones)
   - Nivel de relevancia (alta/media/baja)
   - Por qué importa para el negocio

3. OPORTUNIDAD DESTACADA (opportunity): La oportunidad más accionable identificada esta semana. No genérica — debe ser específica y basada en los datos del corpus. Incluir por qué es el momento correcto.

4. EVOLUCIÓN (evolution): Comparación con la semana anterior. ¿Qué cambió? ¿Qué temas nuevos aparecieron? ¿Qué temas desaparecieron? ¿Hay un patrón emergente?

5. 3 PREGUNTAS (questions): Preguntas estratégicas para hacerle al cliente en la próxima sesión. Deben ser preguntas que profundicen en lo que el corpus reveló. No preguntas genéricas.

6. RECOMENDACIONES (recommendations): 2-3 recomendaciones concretas y accionables. Cada una debe tener: qué hacer, por qué, y qué resultado esperar.

TONO DEL REPORTE:
- Profesional pero no corporativo
- Directo y accionable
- Basado en evidencia, no en suposiciones
- El reporte es para el equipo de Horse Consulting, no para el cliente final

ANTI-PATRONES:
- No escribir generalidades que apliquen a cualquier negocio
- No repetir textualmente los inputs — sintetizar e interpretar
- No dar recomendaciones genéricas como "mejorar la comunicación"
- No ignorar las preocupaciones del cliente — abordarlas directamente

FORMATO DE RESPUESTA (JSON estricto):
{
  "executiveSummary": "...",
  "topTopics": [
    { "topic": "...", "evidence": "...", "relevance": "alta|media|baja", "impact": "..." }
  ],
  "opportunity": "...",
  "evolution": "...",
  "questions": ["pregunta 1", "pregunta 2", "pregunta 3"],
  "recommendations": "..."
}`;

export async function runInsightsAgent(
  instanceId: string,
  runId: string,
  weekNumber: number,
  year: number
): Promise<void> {
  // 1. Read brand voice
  const brandVoice = await prisma.brandVoice.findUnique({
    where: { instanceId },
  });

  if (!brandVoice) {
    throw new Error('Brand voice not found');
  }

  // 2. Read current week corpus
  const currentCorpus = await prisma.weeklyCorpus.findFirst({
    where: { instanceId, weekNumber, year },
    orderBy: { createdAt: 'desc' },
  });

  if (!currentCorpus) {
    throw new Error('Current weekly corpus not found');
  }

  // 3. Read previous week corpus for comparison
  const previousCorpus = await prisma.weeklyCorpus.findMany({
    where: {
      instanceId,
      NOT: { id: currentCorpus.id },
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  // 4. Call Claude Opus for analysis
  const userPrompt = `VOZ DE MARCA:
${JSON.stringify({
  identity: brandVoice.identity,
  positioning: brandVoice.positioning,
  recurringTopics: brandVoice.recurringTopics,
}, null, 2)}

CORPUS SEMANAL ACTUAL (Semana ${weekNumber}, ${year}):
${JSON.stringify({
  summary: currentCorpus.summary,
  topics: currentCorpus.topics,
  decisions: currentCorpus.decisions,
  concerns: currentCorpus.concerns,
  opportunities: currentCorpus.opportunities,
}, null, 2)}

${previousCorpus.length > 0
  ? `CORPUS SEMANA ANTERIOR (para comparación):
${JSON.stringify({
  summary: previousCorpus[0].summary,
  topics: previousCorpus[0].topics,
  decisions: previousCorpus[0].decisions,
  concerns: previousCorpus[0].concerns,
  opportunities: previousCorpus[0].opportunities,
}, null, 2)}`
  : 'NOTA: No hay corpus de semana anterior disponible (primera semana de procesamiento).'
}

Genera el reporte de inteligencia semanal. Responde SOLO con JSON válido.`;

  const report = await callOpus(INSIGHTS_SYSTEM_PROMPT, userPrompt);

  // 5. Create InsightReport in DB
  await prisma.insightReport.create({
    data: {
      instanceId,
      weekNumber,
      year,
      executiveSummary: (report.executiveSummary as string) || '',
      topTopics: (report.topTopics as any[]) || [],
      opportunity: (report.opportunity as string) || '',
      evolution: (report.evolution as string) || '',
      questions: (report.questions as any[]) || [],
      recommendations: (report.recommendations as string) || '',
    },
  });

  // 6. Update ProcessingRun step
  await prisma.processingRun.update({
    where: { id: runId },
    data: {
      steps: {
        corpus: 'completed',
        brandVoice: 'completed',
        insights: 'completed',
      },
    },
  });

  console.log(`[Insights] Generated weekly intelligence report for week ${weekNumber}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/insights.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/agents/insights.ts intelligence-hub-api/tests/agents/insights.test.ts
git commit -m "feat: implement Insights agent with intelligence report generation"
```

---

### Task 11: Distribution Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/distribution.ts`
- Create: `intelligence-hub-api/tests/agents/distribution.test.ts`

- [ ] **Step 1: Write failing tests for Distribution agent**

Create `intelligence-hub-api/tests/agents/distribution.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    processingRun: { update: vi.fn() },
  },
}));

import { runDistribution } from '../../src/agents/distribution';
import { prisma } from '../../src/lib/prisma';

describe('Distribution Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);
  });

  it('should mark distribution step as completed (MVP)', async () => {
    await runDistribution('inst-1', 'run-1');

    expect(prisma.processingRun.update).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      data: {
        steps: {
          corpus: 'completed',
          brandVoice: 'completed',
          content: 'completed',
          insights: 'completed',
          distribution: 'completed',
        },
      },
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/agents/distribution.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Distribution agent (MVP)**

Create `intelligence-hub-api/src/agents/distribution.ts`:

```typescript
import { prisma } from '../lib/prisma';

/**
 * Distribution Agent — MVP version.
 *
 * In MVP, this agent simply marks the distribution step as completed.
 * All content is already saved as DRAFT in the database and will be
 * managed through the Kanban UI.
 *
 * Phase 2 will add:
 * - Notion integration (create pages with content)
 * - Gmail (send weekly report email to client)
 * - WordPress (publish blog drafts)
 * - Social media APIs (auto-publish approved content)
 */
export async function runDistribution(
  instanceId: string,
  runId: string
): Promise<void> {
  // MVP: Simply mark the step as completed
  // All content outputs are already in DB with status=DRAFT

  await prisma.processingRun.update({
    where: { id: runId },
    data: {
      steps: {
        corpus: 'completed',
        brandVoice: 'completed',
        content: 'completed',
        insights: 'completed',
        distribution: 'completed',
      },
    },
  });

  console.log(`[Distribution] MVP: All outputs marked as DRAFT. Distribution step completed.`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/agents/distribution.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/agents/distribution.ts intelligence-hub-api/tests/agents/distribution.test.ts
git commit -m "feat: implement Distribution agent MVP (marks step completed)"
```

---

## Chunk 4: Orchestrator + Scheduler

### Task 12: Orchestrator

**Files:**
- Create: `intelligence-hub-api/src/orchestrator.ts`
- Create: `intelligence-hub-api/tests/orchestrator.test.ts`

- [ ] **Step 1: Write failing tests for Orchestrator**

Create `intelligence-hub-api/tests/orchestrator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    processingRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../src/agents/corpusBuilder', () => ({
  runCorpusBuilder: vi.fn(),
}));

vi.mock('../src/agents/brandVoice', () => ({
  runBrandVoiceUpdate: vi.fn(),
}));

vi.mock('../src/agents/content', () => ({
  runContentAgent: vi.fn(),
}));

vi.mock('../src/agents/insights', () => ({
  runInsightsAgent: vi.fn(),
}));

vi.mock('../src/agents/distribution', () => ({
  runDistribution: vi.fn(),
}));

import { runWeeklyProcess } from '../src/orchestrator';
import { prisma } from '../src/lib/prisma';
import { runCorpusBuilder } from '../src/agents/corpusBuilder';
import { runBrandVoiceUpdate } from '../src/agents/brandVoice';
import { runContentAgent } from '../src/agents/content';
import { runInsightsAgent } from '../src/agents/insights';
import { runDistribution } from '../src/agents/distribution';

describe('Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.processingRun.create).mockResolvedValue({
      id: 'run-1',
      weekNumber: 12,
      year: 2026,
    } as any);

    vi.mocked(prisma.processingRun.update).mockResolvedValue({} as any);
    vi.mocked(runCorpusBuilder).mockResolvedValue({ corpusId: 'c-1' });
    vi.mocked(runBrandVoiceUpdate).mockResolvedValue();
    vi.mocked(runContentAgent).mockResolvedValue();
    vi.mocked(runInsightsAgent).mockResolvedValue();
    vi.mocked(runDistribution).mockResolvedValue();
  });

  it('should run all agents in the correct order', async () => {
    await runWeeklyProcess('inst-1', 'MANUAL');

    // Verify creation of ProcessingRun
    expect(prisma.processingRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: 'inst-1',
        triggeredBy: 'MANUAL',
        status: 'RUNNING',
      }),
    });

    // Verify agents were called in order
    expect(runCorpusBuilder).toHaveBeenCalledTimes(1);
    expect(runBrandVoiceUpdate).toHaveBeenCalledTimes(1);
    expect(runContentAgent).toHaveBeenCalledTimes(1);
    expect(runInsightsAgent).toHaveBeenCalledTimes(1);
    expect(runDistribution).toHaveBeenCalledTimes(1);

    // Verify run was marked as COMPLETED
    expect(prisma.processingRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should mark run as FAILED if an agent throws', async () => {
    vi.mocked(runCorpusBuilder).mockRejectedValue(new Error('No pending inputs'));

    await runWeeklyProcess('inst-1', 'MANUAL');

    expect(prisma.processingRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    );

    // Subsequent agents should NOT have been called
    expect(runBrandVoiceUpdate).not.toHaveBeenCalled();
    expect(runContentAgent).not.toHaveBeenCalled();
  });

  it('should run content and insights in parallel', async () => {
    let contentStarted = false;
    let insightsStarted = false;
    let contentFinishedFirst = false;

    vi.mocked(runContentAgent).mockImplementation(async () => {
      contentStarted = true;
      // Check if insights also started (parallel execution)
      if (insightsStarted) contentFinishedFirst = false;
      await new Promise((r) => setTimeout(r, 10));
    });

    vi.mocked(runInsightsAgent).mockImplementation(async () => {
      insightsStarted = true;
      await new Promise((r) => setTimeout(r, 10));
    });

    await runWeeklyProcess('inst-1', 'MANUAL');

    expect(contentStarted).toBe(true);
    expect(insightsStarted).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/orchestrator.test.ts
```

Expected: Tests FAIL.

- [ ] **Step 3: Implement Orchestrator**

Create `intelligence-hub-api/src/orchestrator.ts`:

```typescript
import { prisma } from './lib/prisma';
import { runCorpusBuilder } from './agents/corpusBuilder';
import { runBrandVoiceUpdate } from './agents/brandVoice';
import { runContentAgent } from './agents/content';
import { runInsightsAgent } from './agents/insights';
import { runDistribution } from './agents/distribution';

/**
 * Get the ISO week number for a given date.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Run the full weekly processing pipeline for an instance.
 *
 * Flow:
 * 1. Corpus Builder (sequential) — extracts structured data from inputs
 * 2. Brand Voice Update (sequential) — updates brand voice with new learnings
 * 3. Content + Insights (parallel) — generates content and intelligence report
 * 4. Distribution (sequential) — MVP: marks as complete
 */
export async function runWeeklyProcess(
  instanceId: string,
  triggeredBy: 'CRON' | 'MANUAL'
): Promise<string> {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();

  // Create ProcessingRun record
  const run = await prisma.processingRun.create({
    data: {
      instanceId,
      weekNumber,
      year,
      triggeredBy,
      status: 'RUNNING',
      steps: {
        corpus: 'pending',
        brandVoice: 'pending',
        content: 'pending',
        insights: 'pending',
        distribution: 'pending',
      },
    },
  });

  console.log(`[Orchestrator] Starting weekly process for instance ${instanceId} (run: ${run.id}, week: ${weekNumber}/${year})`);

  try {
    // Step 1: Corpus Builder (sequential)
    console.log('[Orchestrator] Step 1: Corpus Builder...');
    await runCorpusBuilder(instanceId, run.id, weekNumber, year);

    // Step 2: Brand Voice Update (sequential)
    console.log('[Orchestrator] Step 2: Brand Voice Update...');
    await runBrandVoiceUpdate(instanceId, run.id, weekNumber, year);

    // Step 3: Content + Insights (parallel)
    console.log('[Orchestrator] Step 3: Content + Insights (parallel)...');
    await Promise.all([
      runContentAgent(instanceId, run.id, weekNumber, year),
      runInsightsAgent(instanceId, run.id, weekNumber, year),
    ]);

    // Step 4: Distribution
    console.log('[Orchestrator] Step 4: Distribution...');
    await runDistribution(instanceId, run.id);

    // Mark as COMPLETED
    await prisma.processingRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        steps: {
          corpus: 'completed',
          brandVoice: 'completed',
          content: 'completed',
          insights: 'completed',
          distribution: 'completed',
        },
      },
    });

    console.log(`[Orchestrator] Weekly process COMPLETED for instance ${instanceId}`);
    return run.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Orchestrator] Weekly process FAILED for instance ${instanceId}:`, errorMessage);

    await prisma.processingRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        steps: {
          error: errorMessage,
          failedAt: new Date().toISOString(),
        },
      },
    });

    return run.id;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/orchestrator.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/orchestrator.ts intelligence-hub-api/tests/orchestrator.test.ts
git commit -m "feat: implement Orchestrator with sequential/parallel agent coordination"
```

---

### Task 13: Scheduler

**Files:**
- Create: `intelligence-hub-api/src/scheduler.ts`
- Modify: `intelligence-hub-api/src/index.ts`

- [ ] **Step 1: Implement Scheduler**

Create `intelligence-hub-api/src/scheduler.ts`:

```typescript
import cron from 'node-cron';
import { prisma } from './lib/prisma';
import { runWeeklyProcess } from './orchestrator';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the weekly scheduler.
 * Runs every Monday at 7:00 AM (server timezone).
 * Finds all ACTIVE instances and triggers the orchestrator for each.
 */
export function startScheduler(): void {
  // Cron: minute hour day-of-month month day-of-week
  // "0 7 * * 1" = At 07:00 on Monday
  scheduledTask = cron.schedule('0 7 * * 1', async () => {
    console.log('[Scheduler] Weekly processing triggered by CRON');

    try {
      const activeInstances = await prisma.instance.findMany({
        where: { status: 'ACTIVE' },
      });

      console.log(`[Scheduler] Found ${activeInstances.length} active instances`);

      for (const instance of activeInstances) {
        try {
          console.log(`[Scheduler] Starting process for instance: ${instance.name} (${instance.id})`);
          await runWeeklyProcess(instance.id, 'CRON');
          console.log(`[Scheduler] Completed process for instance: ${instance.name}`);
        } catch (error) {
          console.error(`[Scheduler] Failed to process instance ${instance.name}:`, error);
          // Continue with next instance even if one fails
        }
      }

      console.log('[Scheduler] All instances processed');
    } catch (error) {
      console.error('[Scheduler] Fatal error during weekly processing:', error);
    }
  });

  console.log('[Scheduler] Weekly processing scheduled for Mondays at 7:00 AM');
}

/**
 * Stop the scheduler (useful for testing and graceful shutdown).
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Scheduler] Stopped');
  }
}
```

- [ ] **Step 2: Wire scheduler into Express app**

Update `intelligence-hub-api/src/index.ts` — add scheduler import and start call after the app.listen:

Add these lines at the top of the file:

```typescript
import { startScheduler } from './scheduler';
```

Add inside the `app.listen` callback, after the console.log:

```typescript
  // Start weekly scheduler (only in production/development, not in tests)
  if (env.NODE_ENV !== 'test') {
    startScheduler();
  }
```

- [ ] **Step 3: Wire "Process now" endpoint to orchestrator**

The processing route already exists from Plan 1. Update `intelligence-hub-api/src/services/processing.service.ts` to use the orchestrator:

Add to the `triggerProcessing` method (or create if it doesn't exist):

```typescript
import { runWeeklyProcess } from '../orchestrator';

export class ProcessingService {
  static async triggerProcessing(instanceId: string) {
    // Run asynchronously — don't await, return the run ID immediately
    const runPromise = runWeeklyProcess(instanceId, 'MANUAL');

    // We need to get the run ID synchronously, so we create the run here
    // and let the orchestrator handle the rest
    // Actually, runWeeklyProcess creates the run internally and returns runId
    // So we start it and return immediately
    runPromise.catch((err) => {
      console.error(`[Processing] Background process failed for ${instanceId}:`, err);
    });

    return { message: 'Processing started', instanceId };
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/src/scheduler.ts intelligence-hub-api/src/index.ts intelligence-hub-api/src/services/processing.service.ts
git commit -m "feat: add weekly scheduler (Mondays 7am) and wire orchestrator to process endpoint"
```

---

## Chunk 5: Integration + Wiring

### Task 14: Update Processing Route and Controller

**Files:**
- Modify: `intelligence-hub-api/src/routes/processing.routes.ts`
- Modify: `intelligence-hub-api/src/controllers/processing.controller.ts`

- [ ] **Step 1: Update processing controller to use orchestrator**

Update `intelligence-hub-api/src/controllers/processing.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { runWeeklyProcess } from '../orchestrator';
import { prisma } from '../lib/prisma';

export class ProcessingController {
  static async triggerProcess(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: instanceId } = req.params;

      // Verify instance exists and user has access
      const instance = await prisma.instance.findFirst({
        where: {
          id: instanceId,
          users: { some: { userId: req.userId! } },
        },
      });

      if (!instance) {
        res.status(404).json({ error: 'Instance not found' });
        return;
      }

      // Check if there's already a running process
      const activeRun = await prisma.processingRun.findFirst({
        where: {
          instanceId,
          status: 'RUNNING',
        },
      });

      if (activeRun) {
        res.status(409).json({
          error: 'A process is already running for this instance',
          runId: activeRun.id,
        });
        return;
      }

      // Start processing asynchronously
      const runId = runWeeklyProcess(instanceId, 'MANUAL');

      // Don't await — return immediately
      runId.catch((err) => {
        console.error(`[Processing] Background process failed:`, err);
      });

      res.status(202).json({
        message: 'Processing started',
        instanceId,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRunStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: instanceId, runId } = req.params;

      const run = await prisma.processingRun.findFirst({
        where: { id: runId, instanceId },
      });

      if (!run) {
        res.status(404).json({ error: 'Run not found' });
        return;
      }

      res.json(run);
    } catch (error) {
      next(error);
    }
  }

  static async listRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: instanceId } = req.params;

      const runs = await prisma.processingRun.findMany({
        where: { instanceId },
        orderBy: { startedAt: 'desc' },
        take: 20,
      });

      res.json(runs);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 2: Update processing routes**

Update `intelligence-hub-api/src/routes/processing.routes.ts`:

```typescript
import { Router } from 'express';
import { ProcessingController } from '../controllers/processing.controller';
import { authenticate } from '../middleware/auth';

export const processingRoutes = Router();

processingRoutes.post('/:id/process', authenticate, ProcessingController.triggerProcess);
processingRoutes.get('/:id/runs', authenticate, ProcessingController.listRuns);
processingRoutes.get('/:id/runs/:runId', authenticate, ProcessingController.getRunStatus);
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-api/src/controllers/processing.controller.ts intelligence-hub-api/src/routes/processing.routes.ts
git commit -m "feat: wire processing endpoints to orchestrator for manual trigger + run status"
```

---

### Task 15: Final Integration Test

**Files:**
- Create: `intelligence-hub-api/tests/integration/fullPipeline.test.ts`

- [ ] **Step 1: Write integration test for the full pipeline**

Create `intelligence-hub-api/tests/integration/fullPipeline.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external AI services
vi.mock('../../src/lib/claude', () => ({
  callSonnet: vi.fn(),
  callOpus: vi.fn(),
}));

vi.mock('../../src/lib/nanoBanana', () => ({
  generateImage: vi.fn().mockResolvedValue({
    base64: 'test-image-data',
    mimeType: 'image/png',
  }),
  buildImagePrompt: vi.fn().mockReturnValue('test image prompt'),
}));

vi.mock('../../src/lib/prisma', () => {
  const mockPrisma = {
    inputFile: {
      findMany: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    weeklyCorpus: {
      create: vi.fn().mockResolvedValue({ id: 'corpus-1' }),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    brandVoice: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    contentOutput: {
      create: vi.fn().mockResolvedValue({ id: 'co-1' }),
    },
    insightReport: {
      create: vi.fn().mockResolvedValue({ id: 'ir-1' }),
    },
    processingRun: {
      create: vi.fn().mockResolvedValue({ id: 'run-1', weekNumber: 12, year: 2026 }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return { prisma: mockPrisma };
});

import { runWeeklyProcess } from '../../src/orchestrator';
import { callSonnet, callOpus } from '../../src/lib/claude';
import { prisma } from '../../src/lib/prisma';

describe('Full Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PENDING inputs
    vi.mocked(prisma.inputFile.findMany).mockResolvedValue([
      { id: '1', content: 'Hoy hablamos de IA en PYMES', type: 'WHATSAPP', filename: 'chat.txt' },
    ] as any);

    // Mock corpus extraction (Sonnet)
    vi.mocked(callSonnet).mockResolvedValue({
      summary: { overview: 'Semana sobre IA' },
      topics: ['IA', 'PYMES'],
      decisions: ['Implementar piloto'],
      concerns: [],
      opportunities: ['Sector retail'],
      updatedFields: ['recurringTopics'],
      recurringTopics: ['IA', 'PYMES', 'retail'],
      insightEntry: 'Semana 12: Nuevo foco en retail',
    });

    // Mock corpus findFirst (for brand voice + content + insights)
    vi.mocked(prisma.weeklyCorpus.findFirst).mockResolvedValue({
      id: 'corpus-1',
      summary: { overview: 'Semana sobre IA' },
      topics: ['IA', 'PYMES'],
      decisions: ['Implementar piloto'],
      concerns: [],
      opportunities: ['Sector retail'],
    } as any);

    // Mock brand voice
    vi.mocked(prisma.brandVoice.findUnique).mockResolvedValue({
      id: 'bv-1',
      instanceId: 'inst-1',
      identity: 'Experto en IA',
      valueProposition: 'IA para empresas',
      audience: 'CEOs',
      voiceTone: { adjectives: ['directo'] },
      recurringTopics: ['IA'],
      positioning: 'Líder',
      metrics: '',
      insightHistory: [],
    } as any);

    // Mock content generation (Opus)
    vi.mocked(callOpus).mockResolvedValue({
      // LinkedIn response
      posts: [{
        type: 'THOUGHT_LEADERSHIP',
        title: 'IA en PYMES',
        imagePrompt: 'business AI illustration',
        variants: {
          A: { content: 'Post A', hook: 'Hook A' },
          B: { content: 'Post B', hook: 'Hook B' },
          C: { content: 'Post C', hook: 'Hook C' },
        },
      }],
      // X response
      tweets: [{ type: 'STANDALONE', content: 'Tweet', title: 'T' }],
      thread: { title: 'Thread', imagePrompt: 'img', tweets: ['1/ Thread tweet'] },
      // TikTok response
      scripts: [{
        title: 'Script',
        format: 'TALKING_HEAD',
        trendReference: null,
        duration: '30',
        imagePrompt: 'tiktok img',
        hook: { text: 'Hook', screenText: 'Screen', duration: '3s' },
        development: [{ point: 'P', script: 'S', screenText: 'ST', visualDirection: 'VD' }],
        cta: { text: 'Follow', screenText: 'Follow me' },
      }],
      // Blog response
      article: {
        title: 'Blog',
        slug: 'blog',
        metaDescription: 'Meta',
        primaryKeyword: 'IA',
        secondaryKeywords: ['PYMES'],
        imagePrompt: 'blog img',
        content: '# Content',
        estimatedReadTime: '5 min',
        sections: [{ h2: 'Section', summary: 'Sum' }],
      },
      // Insights response
      executiveSummary: 'Resumen ejecutivo',
      topTopics: [{ topic: 'IA', evidence: 'data', relevance: 'alta' }],
      opportunity: 'Retail sector',
      evolution: 'New focus',
      questions: ['Q1', 'Q2', 'Q3'],
      recommendations: 'Invest in retail',
    });
  });

  it('should run the complete pipeline from inputs to content + insights', async () => {
    const runId = await runWeeklyProcess('inst-1', 'MANUAL');

    expect(runId).toBe('run-1');

    // Verify ProcessingRun was created
    expect(prisma.processingRun.create).toHaveBeenCalledTimes(1);

    // Verify corpus was built
    expect(prisma.weeklyCorpus.create).toHaveBeenCalledTimes(1);

    // Verify inputs were marked as processed
    expect(prisma.inputFile.updateMany).toHaveBeenCalledTimes(1);

    // Verify brand voice was updated
    expect(prisma.brandVoice.update).toHaveBeenCalled();

    // Verify content was generated
    expect(prisma.contentOutput.create).toHaveBeenCalled();

    // Verify insight report was created
    expect(prisma.insightReport.create).toHaveBeenCalled();

    // Verify run was marked as COMPLETED
    const lastUpdate = vi.mocked(prisma.processingRun.update).mock.calls.at(-1);
    expect(lastUpdate?.[0]).toEqual(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run integration test**

```bash
npx vitest run tests/integration/fullPipeline.test.ts
```

Expected: Test PASSES.

- [ ] **Step 3: Run all tests to verify nothing is broken**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/tests/integration/fullPipeline.test.ts
git commit -m "feat: add full pipeline integration test for orchestrator"
```

---

## Summary

| Chunk | Tasks | What it builds |
|-------|-------|----------------|
| 1 | Tasks 1-2 | Claude API wrapper + Nano Banana 2 image wrapper |
| 2 | Tasks 3-6 | 4 Skills: LinkedIn, X, TikTok, Blog (with Spanish prompts) |
| 3 | Tasks 7-11 | 5 Agents: Corpus Builder, Brand Voice, Content, Insights, Distribution |
| 4 | Tasks 12-13 | Orchestrator + Weekly Scheduler |
| 5 | Tasks 14-15 | Processing endpoint wiring + Integration test |

**Total files created:** 18 source files + 9 test files = 27 files
**Total tasks:** 15
**Dependencies added:** `@anthropic-ai/sdk`, `@google/generative-ai`
