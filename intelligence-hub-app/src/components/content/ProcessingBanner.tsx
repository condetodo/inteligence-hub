import { ProcessingRun } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  run: ProcessingRun | null;
  contentCount: number;
}

export default function ProcessingBanner({ run, contentCount }: Props) {
  if (!run) return null;

  const dateStr = format(new Date(run.startedAt), "EEEE d MMM, h:mma", { locale: es });

  return (
    <div className="bg-white border border-horse-gray-200 rounded-[10px] px-5 py-3.5 mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[13px] text-horse-gray-700">
        <span className={`w-2 h-2 rounded-full ${run.status === 'RUNNING' ? 'bg-status-review animate-pulse' : run.status === 'COMPLETED' ? 'bg-status-approved' : 'bg-red-500'}`} />
        <span>
          {run.status === 'RUNNING' ? 'Procesando...' : `Ultimo procesamiento: ${dateStr}`}
          {run.status === 'COMPLETED' && <strong> — {contentCount} piezas generadas</strong>}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-horse-gray-400">
        {Object.entries(run.steps || {}).map(([name, status]) => (
          <span key={name} className={status === 'completed' || status === 'reused' || status === 'skipped' ? 'text-status-approved font-medium' : status === 'running' ? 'text-status-review font-medium' : status === 'failed' ? 'text-red-500 font-medium' : ''}>
            {status === 'completed' || status === 'reused' || status === 'skipped' ? '✓' : status === 'running' ? '◌' : status === 'failed' ? '✕' : '○'} {name}
          </span>
        ))}
      </div>
    </div>
  );
}
