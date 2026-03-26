import { ProcessingRun, StepStatus } from "@/lib/types";
import { STEP_ORDER, STEP_LABELS } from "@/lib/processing";
import { CheckCircle2, XCircle, Loader2, MinusCircle, RefreshCw, Circle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  run: ProcessingRun;
}

const stepIconConfig: Record<StepStatus, { icon: typeof Circle; colorClass: string; animate?: boolean }> = {
  pending: { icon: Circle, colorClass: "text-horse-gray-300" },
  running: { icon: Loader2, colorClass: "text-status-review", animate: true },
  completed: { icon: CheckCircle2, colorClass: "text-status-approved" },
  failed: { icon: XCircle, colorClass: "text-red-500" },
  reused: { icon: RefreshCw, colorClass: "text-status-review" },
  skipped: { icon: MinusCircle, colorClass: "text-horse-gray-300" },
};

const stepLineColor: Record<StepStatus, string> = {
  pending: "bg-horse-gray-200",
  running: "bg-status-review",
  completed: "bg-status-approved",
  failed: "bg-red-400",
  reused: "bg-status-review",
  skipped: "bg-horse-gray-200",
};

function formatDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return "<1s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function ProcessingStepper({ run }: Props) {
  const steps = run.steps || {};
  const orderedSteps = STEP_ORDER.filter((key) => key in steps);
  const duration = formatDuration(run.startedAt, run.completedAt);

  return (
    <div className="py-2">
      {/* Run header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-xs text-horse-gray-400">
          Iniciado {format(new Date(run.startedAt), "HH:mm:ss", { locale: es })}
        </div>
        {duration && (
          <div className="text-xs text-horse-gray-400">
            Duración total: <span className="font-medium text-horse-black">{duration}</span>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="relative pl-4">
        {orderedSteps.map((stepKey, index) => {
          const status = steps[stepKey];
          const config = stepIconConfig[status];
          const Icon = config.icon;
          const isLast = index === orderedSteps.length - 1;
          const label = STEP_LABELS[stepKey] || stepKey;

          return (
            <div key={stepKey} className="relative flex items-start gap-3 pb-6 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-12px)] ${stepLineColor[status]}`}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <Icon
                  size={20}
                  className={`${config.colorClass} ${config.animate ? "animate-spin" : ""}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-horse-black">{label}</span>
                  <span className={`text-[11px] font-semibold ${config.colorClass}`}>
                    {status === "completed" ? "Completado" : status === "running" ? "En proceso" : status === "failed" ? "Error" : status === "reused" ? "Reutilizado" : status === "skipped" ? "Omitido" : "Pendiente"}
                  </span>
                </div>

                {/* Step status details */}
                {status === "running" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1 flex-1 max-w-[120px] bg-horse-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-status-review rounded-full animate-pulse w-2/3" />
                    </div>
                    <span className="text-[10px] text-horse-gray-400">Procesando...</span>
                  </div>
                )}

                {status === "failed" && (
                  <p className="mt-1 text-[11px] text-red-500">El step falló durante la ejecución</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
