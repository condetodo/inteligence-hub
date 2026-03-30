'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BrandVoice } from '@/lib/types';
import { getCurrentWeek } from '@/lib/weeks';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import BrandVoiceForm from '@/components/brand-voice/BrandVoiceForm';
import WeekSelector from '@/components/ui/WeekSelector';
import { Mic } from 'lucide-react';

export default function BrandVoicePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [week, setWeek] = useState(getCurrentWeek);
  const currentWeek = getCurrentWeek();
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSnapshot, setIsSnapshot] = useState(false);

  const isCurrentWeek = week.weekNumber === currentWeek.weekNumber && week.year === currentWeek.year;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isCurrentWeek) {
        const res = await api.get<BrandVoice>(`/instances/${id}/brand-voice`);
        setBrandVoice(res);
        setIsSnapshot(false);
      } else {
        const res = await api.get<BrandVoice>(
          `/instances/${id}/brand-voice/snapshot?week=${week.weekNumber}&year=${week.year}`
        );
        setBrandVoice(res);
        setIsSnapshot(true);
      }
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error?.status === 404) {
        setBrandVoice(null);
      } else {
        toast.error('Error al cargar brand voice');
      }
    } finally {
      setLoading(false);
    }
  }, [id, week, isCurrentWeek, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (data: Partial<BrandVoice>) => {
    try {
      const res = await api.put<BrandVoice>(`/instances/${id}/brand-voice`, data);
      setBrandVoice(res);
      toast.success('Brand voice guardado');
    } catch {
      toast.error('Error al guardar brand voice');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-horse-black">Brand Voice</h2>
          <p className="text-sm text-horse-gray-400 mt-0.5">Define la voz y personalidad del contenido</p>
        </div>
        <WeekSelector
          year={week.year}
          weekNumber={week.weekNumber}
          onChange={(y, w) => setWeek({ year: y, weekNumber: w })}
        />
      </div>

      {isSnapshot && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Estás viendo el brand voice de la <span className="font-semibold">semana {week.weekNumber}</span>. Solo lectura — los cambios se hacen en la semana actual.
        </div>
      )}

      {loading ? (
        <PageLoader message="Cargando brand voice..." />
      ) : brandVoice ? (
        <BrandVoiceForm data={brandVoice} onSave={handleSave} readOnly={isSnapshot} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Mic size={32} className="mb-3 text-horse-gray-300" />
          {isSnapshot
            ? `No hay snapshot de brand voice para la semana ${week.weekNumber}`
            : 'No hay brand voice configurado'}
        </div>
      )}
    </div>
  );
}
