'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { BrandVoice } from '@/lib/types';
import { getCurrentWeek } from '@/lib/weeks';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import BrandVoiceIdentityForm from '@/components/brand-voice/BrandVoiceIdentityForm';
import BrandVoiceKB from '@/components/brand-voice/BrandVoiceKB';
import WeekSelector from '@/components/ui/WeekSelector';
import { Mic } from 'lucide-react';

export default function BrandVoicePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [week, setWeek] = useState(getCurrentWeek);
  const currentWeek = getCurrentWeek();
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'identity' | 'kb'>('identity');

  const isCurrentWeek = week.weekNumber === currentWeek.weekNumber && week.year === currentWeek.year;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setBrandVoice(null);
      try {
        if (isCurrentWeek) {
          const res = await api.get<BrandVoice>(`/instances/${id}/brand-voice`);
          if (!cancelled) setBrandVoice(res);
        } else {
          const res = await api.get<BrandVoice>(
            `/instances/${id}/brand-voice/snapshot?week=${week.weekNumber}&year=${week.year}`
          );
          if (!cancelled) setBrandVoice(res);
        }
      } catch (err: unknown) {
        const error = err as { status?: number };
        if (!cancelled) {
          if (error?.status !== 404) {
            toastRef.current.error('Error al cargar brand voice');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, week, isCurrentWeek]);

  const handleSave = async (data: Partial<BrandVoice>) => {
    try {
      const res = await api.put<BrandVoice>(`/instances/${id}/brand-voice`, data);
      setBrandVoice(res);
      toast.success('Brand voice guardado');
    } catch {
      toast.error('Error al guardar brand voice');
    }
  };

  const tabs = [
    { key: 'identity' as const, label: 'Identidad' },
    { key: 'kb' as const, label: 'Knowledge Base' },
  ];

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

      {!isCurrentWeek && brandVoice && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Estas viendo el brand voice de la <span className="font-semibold">semana {week.weekNumber}</span>. Solo lectura — los cambios se hacen en la semana actual.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-horse-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-horse-black border-horse-black'
                : 'text-horse-gray-400 border-transparent hover:text-horse-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader message="Cargando brand voice..." />
      ) : brandVoice ? (
        <>
          {activeTab === 'identity' && (
            <BrandVoiceIdentityForm
              data={brandVoice}
              onSave={handleSave}
              readOnly={!isCurrentWeek}
            />
          )}
          {activeTab === 'kb' && (
            <BrandVoiceKB
              data={brandVoice}
              onSave={handleSave}
              readOnly={!isCurrentWeek}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Mic size={32} className="mb-3 text-horse-gray-300" />
          {!isCurrentWeek
            ? `No hay snapshot de brand voice para la semana ${week.weekNumber}`
            : 'No hay brand voice configurado'}
        </div>
      )}
    </div>
  );
}
