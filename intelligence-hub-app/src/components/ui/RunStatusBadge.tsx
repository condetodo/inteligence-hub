import { ProcessingRun } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getCompletedStepCount, getRunningStepName, getFailedStepName } from "@/lib/processing";

interface Props {
  run: ProcessingRun | null;
}

export function RunStatusBadge({ run }: Props) {
  if (!run) return null;

  const totalSteps = Object.keys(run.steps || {}).length;

  if (run.status === "RUNNING") {
    const completed = getCompletedStepCount(run.steps);
    const currentStep = getRunningStepName(run.steps);
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(45,108,206,0.1)] text-status-review text-[11px] font-semibold">
        <Loader2 size={12} className="animate-spin" />
        <span>
          {currentStep || "Procesando"} ({completed}/{totalSteps})
        </span>
      </div>
    );
  }

  if (run.status === "COMPLETED") {
    const timeAgo = formatDistanceToNow(new Date(run.completedAt!), { addSuffix: true, locale: es });
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(42,157,92,0.1)] text-status-approved text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-status-approved" />
        <span>Completado {timeAgo}</span>
      </div>
    );
  }

  if (run.status === "FAILED") {
    const failedStep = getFailedStepName(run.steps);
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(220,38,38,0.1)] text-red-500 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span>Error{failedStep ? ` en ${failedStep}` : ""}</span>
      </div>
    );
  }

  return null;
}
