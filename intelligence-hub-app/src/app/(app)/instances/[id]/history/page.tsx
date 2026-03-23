'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProcessingRun } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import ProcessingTimeline from '@/components/history/ProcessingTimeline';

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [runs, setRuns] = useState<ProcessingRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ProcessingRun[]>(`/instances/${id}/runs`);
        setRuns(res);
      } catch {
        toast.error('Error al cargar historial');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Historial de Procesamientos</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">{runs.length} ejecuciones registradas</p>
      </div>

      {loading ? (
        <PageLoader message="Cargando historial..." />
      ) : (
        <ProcessingTimeline runs={runs} />
      )}
    </div>
  );
}
