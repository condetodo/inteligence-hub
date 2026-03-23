import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const OPUS_MODEL = 'claude-sonnet-4-5-20250929';
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

export async function callSonnet(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096
): Promise<Record<string, unknown>> {
  return callClaude(SONNET_MODEL, systemPrompt, userPrompt, maxTokens);
}

export async function callOpus(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8192
): Promise<Record<string, unknown>> {
  return callClaude(OPUS_MODEL, systemPrompt, userPrompt, maxTokens);
}
