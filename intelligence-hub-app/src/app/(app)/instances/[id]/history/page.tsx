'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProcessingRun } from '@/lib/types';
import { api } from '@/lib/api';
import ProcessingTimeline from '@/components/history/ProcessingTimeline';

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [runs, setRuns] = useState<ProcessingRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ProcessingRun[]>(`/instances/${id}/runs`);
        setRuns(res);
      } catch (err) {
        console.error('Failed to fetch runs:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Historial de Procesamientos</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">{runs.length} ejecuciones registradas</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando historial...</div>
      ) : (
        <ProcessingTimeline runs={runs} />
      )}
    </div>
  );
}
