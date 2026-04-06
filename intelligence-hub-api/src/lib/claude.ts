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

      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

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
