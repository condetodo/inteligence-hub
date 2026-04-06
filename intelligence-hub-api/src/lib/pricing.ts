const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-20250514':         { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  'claude-sonnet-4-5-20250929':     { input: 3 / 1_000_000,  output: 15 / 1_000_000 },
  'gemini-3.1-flash-image-preview': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model];
  if (!price) return 0;
  return inputTokens * price.input + outputTokens * price.output;
}
