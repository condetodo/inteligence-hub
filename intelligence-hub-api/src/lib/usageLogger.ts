import { prisma } from './prisma';
import { estimateCost } from './pricing';

interface LogUsageParams {
  instanceId: string;
  processingRunId?: string;
  provider: 'anthropic' | 'google';
  model: string;
  stepName: string;
  inputTokens: number;
  outputTokens: number;
}

export async function logUsage(params: LogUsageParams) {
  const cost = estimateCost(params.model, params.inputTokens, params.outputTokens);

  await prisma.aPIUsageLog.create({
    data: {
      instanceId: params.instanceId,
      processingRunId: params.processingRunId ?? null,
      provider: params.provider,
      model: params.model,
      stepName: params.stepName,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: cost,
    },
  });
}
