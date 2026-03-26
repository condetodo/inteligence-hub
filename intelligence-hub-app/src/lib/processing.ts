import { StepStatus } from "./types";

export const STEP_ORDER = ["corpus", "distillation", "content", "insights", "distribution"] as const;

export const STEP_LABELS: Record<string, string> = {
  corpus: "Corpus",
  distillation: "Destilación",
  content: "Contenido",
  insights: "Insights",
  distribution: "Distribución",
  // Backward compat with existing runs
  brandVoice: "Brand Voice",
};

export function getCompletedStepCount(steps: Record<string, StepStatus>): number {
  return Object.values(steps).filter((s) => s === "completed" || s === "reused" || s === "skipped").length;
}

export function getRunningStepName(steps: Record<string, StepStatus>): string | null {
  const entry = Object.entries(steps).find(([, s]) => s === "running");
  if (!entry) return null;
  return STEP_LABELS[entry[0]] || entry[0];
}

export function getFailedStepName(steps: Record<string, StepStatus>): string | null {
  const entry = Object.entries(steps).find(([, s]) => s === "failed");
  if (!entry) return null;
  return STEP_LABELS[entry[0]] || entry[0];
}
