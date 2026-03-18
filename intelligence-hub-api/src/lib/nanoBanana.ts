import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

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

export function buildImagePrompt(
  platform: string,
  title: string,
  topics: string[]
): string {
  const topicStr = topics.slice(0, 3).join(', ');
  return `${platform} post illustration about: ${title}. Related topics: ${topicStr}. Professional business context.`;
}
