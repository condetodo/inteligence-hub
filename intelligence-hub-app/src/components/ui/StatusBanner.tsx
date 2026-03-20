import { ProcessingRun } from "@/lib/types";

interface StatusBannerProps {
  run: ProcessingRun | null;
}

const stepLabels: Record<string, string> = {
  corpus: "Corpus",
  brandVoice: "Brand Voice",
  content: "Contenido",
  insights: "Insights",
  distribution: "Distribución",
};

export function StatusBanner({ run }: StatusBannerProps) {
  if (!run) return null;

  const isRunning = run.status === "RUNNING";
  const isFailed = run.status === "FAILED";

  return (
    <div className="bg-white border border-horse-gray-200 rounded-[10px] p-3.5 px-5 flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5 text-[13px] text-horse-gray-700">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? "bg-status-approved animate-pulse" : isFailed ? "bg-red-500" : "bg-status-approved"
          }`}
        />
        <span>
          {isRunning
            ? "Procesando..."
            : isFailed
              ? "Error en procesamiento"
              : `Último procesamiento: ${new Date(run.completedAt || run.startedAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-horse-gray-400">
        {Object.entries(run.steps).map(([key, status]) => (
          <span key={key} className={status === "completed" ? "text-status-approved font-medium" : ""}>
            {status === "completed" ? "\u2713 " : ""}
            {stepLabels[key] || key}
          </span>
        ))}
      </div>
    </div>
  );
}
