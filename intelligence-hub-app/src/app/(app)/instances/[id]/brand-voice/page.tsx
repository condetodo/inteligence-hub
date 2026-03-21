'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BrandVoice } from '@/lib/types';
import { api } from '@/lib/api';
import BrandVoiceForm from '@/components/brand-voice/BrandVoiceForm';
import { Mic } from 'lucide-react';

export default function BrandVoicePage() {
  const { id } = useParams<{ id: string }>();
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<BrandVoice>(`/instances/${id}/brand-voice`);
        setBrandVoice(res);
      } catch (err) {
        console.error('Failed to fetch brand voice:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (data: Partial<BrandVoice>) => {
    const res = await api.put<BrandVoice>(`/instances/${id}/brand-voice`, data);
    setBrandVoice(res);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Brand Voice</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">Define la voz y personalidad del contenido</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando brand voice...</div>
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
