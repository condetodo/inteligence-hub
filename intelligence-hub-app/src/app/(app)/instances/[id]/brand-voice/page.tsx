'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BrandVoice } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import BrandVoiceForm from '@/components/brand-voice/BrandVoiceForm';
import { Mic } from 'lucide-react';

export default function BrandVoicePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<BrandVoice>(`/instances/${id}/brand-voice`);
        setBrandVoice(res);
      } catch {
        toast.error('Error al cargar brand voice');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

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
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Brand Voice</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">Define la voz y personalidad del contenido</p>
      </div>

      {loading ? (
        <PageLoader message="Cargando brand voice..." />
      ) : brandVoice ? (
        <BrandVoiceForm data={brandVoice} onSave={handleSave} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Mic size={32} className="mb-3 text-horse-gray-300" />
          No hay brand voice configurado
        </div>
      )}
    </div>
  );
}
