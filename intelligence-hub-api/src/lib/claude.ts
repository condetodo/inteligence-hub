import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ClaudeResult {
  data: Record<string, unknown>;
  usage: ClaudeUsage;
}

const SONNET_MODEL = 'claude-sonnet-4-6';
const OPUS_MODEL = 'claude-opus-4-6';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Calibrated max_tokens per agent step.
 *
 * Rationale: the previous defaults (Sonnet 4096, Opus 8192, Blog 12000) were
 * arbitrary. Each agent now gets a ceiling sized against its realistic JSON
 * output — content words plus structural overhead plus a 1.5x safety factor,
 * rounded up to the next 1024.
 *
 * What this changes:
 *  - Runaway generations get cut earlier (observability win)
 *  - Content that breaks the ceiling will surface as a real signal, not noise
 *  - Normal traffic is unaffected: Claude only uses what it needs
 *
 * What this does NOT change:
 *  - Pricing. API cost scales with actual output tokens, not this ceiling
 *  - Normal completions. Agents generating 2k tokens under an 8k ceiling
 *    will keep generating 2k tokens under a 4k ceiling
 *
 * These values were derived from static schema analysis in April 2026. They
 * should be revisited with real p95/p99 data once APIUsageLog has accumulated
 * enough runs (see ROADMAP — data-driven refinement pending).
 */
export const MAX_TOKENS = {
  // Pipeline agents
  corpus: 4096,          // summary + topics + decisions + concerns + opportunities
  distillation: 6144,    // updatedFields + topics + contacts + narratives + weeklyInsight
  insights: 4096,        // executiveSummary + topTopics + opportunity + evolution + recommendations
  consistency: 6144,     // scores + notes for up to ~15 drafts
  summaryExtractor: 2048, // 400-word summary of a strategic doc; 1024 was too tight for complex docs with many keyPoints (saw 3/3 failures in "Unterminated string" territory)

  // Content agents
  linkedin: 6144,        // N posts × 3 variants × ~200 words each
  x: 2048,               // N short tweets + 1 thread of 5-8 tweets
  tiktok: 3072,          // N scripts of 60-90 seconds
  blog: 4096,            // 1 article of 800-1200 words
} as const;

/**
 * Canonical JSON output directive. Append this to every agent's system prompt
 * (after the FORMATO DE RESPUESTA block) to guarantee pure-JSON responses.
 *
 * Why this matters: models occasionally wrap structured output in prose or
 * markdown fences ("Aquí tienes el análisis:", ```json ... ```), which
 * breaks downstream JSON.parse(). The extractJsonBlock() helper below is a
 * safety net, but prevention at prompt level is cheaper (fewer retries,
 * lower token usage, more predictable latency).
 *
 * Keep this string in sync across all agents by importing it — do not
 * duplicate the text inline.
 */
export const STRICT_JSON_DIRECTIVE = `
REGLAS DE SALIDA (OBLIGATORIAS):
- Tu respuesta debe ser EXCLUSIVAMENTE el objeto JSON que se describe arriba.
- El primer caracter debe ser { y el ultimo debe ser }. Nada antes, nada despues.
- NO uses bloques de codigo markdown (\`\`\`json ... \`\`\`).
- NO incluyas prosa explicativa, notas, comentarios ni disculpas.
- NO envuelvas el JSON en una clave contenedora extra.
- Si no tenes informacion para un campo, devuelve una cadena vacia, null, o un arreglo vacio segun corresponda al tipo — nunca texto libre.`.trim();

/**
 * Extracts a JSON block from a Claude response, tolerating common formats:
 * - Pure JSON
 * - JSON wrapped in ```json fences
 * - JSON with prose before and/or after (e.g. "Here is the analysis: { ... }")
 * - Fenced JSON embedded in a longer message
 *
 * Strategy:
 * 1. If a ```json ... ``` (or bare ``` ... ```) fence exists, use its inner content.
 * 2. Otherwise, slice from the first `{` or `[` to its matching closing brace/bracket
 *    (tracking string literals and escape sequences so braces inside strings don't break).
 * 3. Fall back to trimmed raw text as last resort (will surface a clear JSON.parse error).
 */
function extractJsonBlock(rawText: string): string {
  const text = rawText.trim();

  // 1. Try fenced code block first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1].trim()) {
    return fenceMatch[1].trim();
  }

  // 2. Find the first opening brace/bracket and walk to its matching close
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');
  const candidates = [firstObj, firstArr].filter((i) => i !== -1);
  if (candidates.length === 0) {
    return text;
  }
  const start = Math.min(...candidates);
  const openChar = text[start];
  const closeChar = openChar === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return text.substring(start, i + 1);
      }
    }
  }

  // 3. Unbalanced — fall back to raw substring from first opener to end
  return text.substring(start);
}

async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<ClaudeResult> {
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

      const jsonText = extractJsonBlock(textBlock.text);

      return {
        data: JSON.parse(jsonText),
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          model,
        },
      };
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

export async function callSonnet(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<ClaudeResult> {
  return callClaude(SONNET_MODEL, systemPrompt, userPrompt, maxTokens);
}

export async function callOpus(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192
): Promise<ClaudeResult> {
  return callClaude(OPUS_MODEL, systemPrompt, userPrompt, maxTokens);
}
