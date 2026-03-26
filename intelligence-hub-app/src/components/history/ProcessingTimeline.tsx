'use client';

import { useState } from 'react';
import { ProcessingRun } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, Loader2, ChevronDown } from 'lucide-react';
import ProcessingStepper from './ProcessingStepper';

interface Props {
  runs: ProcessingRun[];
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-status-approved', label: 'Completado' },
  RUNNING: { icon: Loader2, color: 'text-status-review', label: 'En proceso' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Error' },
};

export default function ProcessingTimeline({ runs }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    // Auto-expand if there's a running run
    runs.find((r) => r.status === 'RUNNING')?.id || null
  );

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
        const isExpanded = expandedId === run.id;

        return (
          <div key={run.id} className="bg-white border border-horse-gray-200 rounded-xl overflow-hidden">
            {/* Clickable header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : run.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-horse-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={`${cfg.color} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                <div className="text-left">
                  <div className="text-sm font-medium text-horse-black">
                    Semana {run.weekNumber}, {run.year}
                  </div>
                  <div className="text-xs text-horse-gray-400 mt-0.5">
                    {format(new Date(run.startedAt), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                    {run.completedAt && ` — ${format(new Date(run.completedAt), "HH:mm", { locale: es })}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-horse-gray-400 bg-horse-gray-100 px-2 py-0.5 rounded">
                  {run.triggeredBy === 'CRON' ? 'Automatico' : 'Manual'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-horse-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Expandable stepper */}
            {isExpanded && (
              <div className="px-5 pb-4 border-t border-horse-gray-100">
                <ProcessingStepper run={run} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
