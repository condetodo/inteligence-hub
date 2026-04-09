import { useState } from 'react';
import { ProcessingRun } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProcessingModal from './ProcessingModal';

interface PlatformOption {
  platform: string;
  enabled: boolean;
  postsPerPeriod: number;
}

interface Props {
  run: ProcessingRun | null;
  contentCount: number;
  instanceId: string;
  platforms: PlatformOption[];
  onProcessingStarted?: () => void;
}

export default function ProcessingBanner({ run, contentCount, instanceId, platforms, onProcessingStarted }: Props) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRunning = run?.status === 'RUNNING';

  const handleSubmit = async (config: { contentTypes: string[]; milestone?: { description: string; tone: string }; directives?: string; platforms: string[] }) => {
    setSubmitting(true);
    try {
      await api.post(`/instances/${instanceId}/process`, { config });
      toast.success('Procesamiento iniciado');
      setShowModal(false);
      onProcessingStarted?.();
    } catch (err: unknown) {
      const error = err as { message?: string; body?: { error?: string } };
      const msg = error?.body?.error || error?.message || 'Error desconocido';
      toast.error(`Error al procesar: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const dateStr = run ? format(new Date(run.startedAt), "EEEE d MMM, h:mma", { locale: es }) : '';

  return (
    <>
      <div className="bg-white border border-horse-warm-border rounded-[10px] px-5 py-3.5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[13px] text-horse-gray-700">
          {run && (
            <>
              <span className={`w-2 h-2 rounded-full ${run.status === 'RUNNING' ? 'bg-status-review animate-pulse' : run.status === 'COMPLETED' ? 'bg-status-approved' : 'bg-red-500'}`} />
              <span>
                {run.status === 'RUNNING' ? 'Procesando...' : `Ultimo procesamiento: ${dateStr}`}
                {run.status === 'COMPLETED' && <strong> — {contentCount} piezas generadas</strong>}
              </span>
            </>
          )}
          {!run && (
            <span className="text-horse-gray-400">Sin procesamiento previo</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {run && (
            <div className="flex gap-4 text-xs text-horse-gray-400">
              {Object.entries(run.steps || {}).map(([name, status]) => (
                <span key={name} className={status === 'completed' || status === 'reused' || status === 'skipped' ? 'text-status-approved font-medium' : status === 'running' ? 'text-status-review font-medium' : status === 'failed' ? 'text-red-500 font-medium' : ''}>
                  {status === 'completed' || status === 'reused' || status === 'skipped' ? '✓' : status === 'running' ? '◌' : status === 'failed' ? '✕' : '○'} {name}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            disabled={isRunning}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-horse-gold text-horse-black hover:bg-horse-gold-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isRunning ? 'Procesando...' : '\u26A1 Procesar'}
          </button>
        </div>
      </div>

      {showModal && (
        <ProcessingModal
          instanceId={instanceId}
          platforms={platforms}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </>
  );
}
