import { prisma } from '../lib/prisma';

export class CostService {
  static async getByInstance(instanceId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const logs = await prisma.aPIUsageLog.findMany({
      where: {
        instanceId,
        createdAt: { gte: startDate, lt: endDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by processingRunId
    const runMap = new Map<string, typeof logs>();
    const orphanLogs: typeof logs = [];

    for (const log of logs) {
      if (log.processingRunId) {
        const group = runMap.get(log.processingRunId) || [];
        group.push(log);
        runMap.set(log.processingRunId, group);
      } else {
        orphanLogs.push(log);
      }
    }

    // Fetch run metadata
    const runIds = Array.from(runMap.keys());
    const runs = await prisma.processingRun.findMany({
      where: { id: { in: runIds } },
      orderBy: { startedAt: 'desc' },
    });

    const runResults = runs.map((run) => {
      const runLogs = runMap.get(run.id) || [];
      const totalCost = runLogs.reduce((s, l) => s + l.estimatedCostUsd, 0);
      const totalInput = runLogs.reduce((s, l) => s + l.inputTokens, 0);
      const totalOutput = runLogs.reduce((s, l) => s + l.outputTokens, 0);

      return {
        runId: run.id,
        weekNumber: run.weekNumber,
        startedAt: run.startedAt,
        status: run.status,
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        steps: runLogs.map((l) => ({
          stepName: l.stepName,
          provider: l.provider,
          model: l.model,
          inputTokens: l.inputTokens,
          outputTokens: l.outputTokens,
          cost: Math.round(l.estimatedCostUsd * 10000) / 10000,
        })),
      };
    });

    const imageCosts = orphanLogs.map((l) => ({
      stepName: l.stepName,
      provider: l.provider,
      model: l.model,
      inputTokens: l.inputTokens,
      outputTokens: l.outputTokens,
      cost: Math.round(l.estimatedCostUsd * 10000) / 10000,
      createdAt: l.createdAt,
    }));

    const totalCost = logs.reduce((s, l) => s + l.estimatedCostUsd, 0);

    return {
      runs: runResults,
      imageCosts,
      summary: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalRuns: runs.length,
        avgCostPerRun: runs.length > 0 ? Math.round((totalCost / runs.length) * 10000) / 10000 : 0,
      },
    };
  }
}
