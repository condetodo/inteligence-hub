'use client';

import { useState, useEffect, useRef } from 'react';
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCountRef = useRef(0);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await api.get<ProcessingRun[]>(`/instances/${id}/runs`);
        setRuns(res);
        return res;
      } catch {
        toast.error('Error al cargar historial');
        return [];
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();

    const poll = async () => {
      const data = await fetchRuns();
      const hasRunning = data.some((r) => r.status === 'RUNNING');

      if (hasRunning) {
        idleCountRef.current = 0;
      } else {
        idleCountRef.current += 1;
      }

      // Stop polling after ~60s of no running (6 ticks of 10s)
      if (idleCountRef.current >= 6 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start at 5s, will adjust based on state
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
