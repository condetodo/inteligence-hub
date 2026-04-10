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

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const OPUS_MODEL = 'claude-opus-4-20250514';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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
