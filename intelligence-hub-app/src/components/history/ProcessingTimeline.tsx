import { ProcessingRun } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  runs: ProcessingRun[];
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-status-approved', label: 'Completado' },
  RUNNING: { icon: Loader2, color: 'text-status-review', label: 'En proceso' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Error' },
};

export default function ProcessingTimeline({ runs }: Props) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
        <Clock size={32} className="mb-3 text-horse-gray-300" />
        No hay procesamientos registrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => {
        const cfg = statusConfig[run.status];
        const Icon = cfg.icon;
        return (
          <div key={run.id} className="bg-white border border-horse-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon size={20} className={`${cfg.color} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                <div>
                  <div className="text-sm font-medium text-horse-black">
                    Semana {run.weekNumber}, {run.year}
                  </div>
                  <div className="text-xs text-horse-gray-400 mt-0.5">
                    {format(new Date(run.startedAt), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                    {run.completedAt && ` — ${format(new Date(run.completedAt), "HH:mm", { locale: es })}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-horse-gray-400 bg-horse-gray-100 px-2 py-0.5 rounded">
                  {run.triggeredBy === 'CRON' ? 'Automatico' : 'Manual'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {run.steps.map((step, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-1.5 rounded-full mb-1.5 ${
                    step.status === 'done' ? 'bg-status-approved'
                    : step.status === 'running' ? 'bg-status-review animate-pulse'
                    : step.status === 'failed' ? 'bg-red-400'
                    : 'bg-horse-gray-200'
                  }`} />
                  <div className="text-[10px] text-horse-gray-400 font-medium">{step.name}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
