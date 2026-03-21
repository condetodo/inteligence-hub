'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { InsightReport as InsightReportType } from '@/lib/types';
import { getCurrentWeek } from '@/lib/weeks';
import { api } from '@/lib/api';
import WeekSelector from '@/components/ui/WeekSelector';
import InsightReportComponent from '@/components/insights/InsightReport';
import { Brain } from 'lucide-react';

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>();
  const [week, setWeek] = useState(getCurrentWeek);
  const [report, setReport] = useState<InsightReportType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InsightReportType>(`/instances/${id}/insights/${week.weekNumber}?year=${week.year}`);
      setReport(res);
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error?.status === 404) setReport(null);
      else console.error('Failed to fetch insight:', err);
    } finally {
      setLoading(false);
    }
  }, [id, week]);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Insights</h2>
        <WeekSelector year={week.year} weekNumber={week.weekNumber} onChange={(y, w) => setWeek({ year: y, weekNumber: w })} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando insights...</div>
      ) : report ? (
        <InsightReportComponent report={report} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Brain size={32} className="mb-3 text-horse-gray-300" />
          No hay insight para esta semana
        </div>
      )}
    </div>
  );
}
