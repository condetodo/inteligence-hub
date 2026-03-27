'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StepIndicator from '@/components/wizard/StepIndicator';
import StepProfile from '@/components/wizard/StepProfile';
import StepPlatforms, { PlatformConfig } from '@/components/wizard/StepPlatforms';
import StepProcessing from '@/components/wizard/StepProcessing';
import StepSummary from '@/components/wizard/StepSummary';
import { useToast } from '@/components/ui/Toast';

const STEPS = ['Perfil', 'Plataformas', 'Procesamiento', 'Resumen'];

const defaultPlatforms: PlatformConfig[] = [
  { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
  { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
  { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
  { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
];

export default function NewInstancePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    name: '', clientName: '', clientRole: '', company: '', industry: '',
  });
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(defaultPlatforms);
  const [processing, setProcessing] = useState<{ processingPeriod: 'WEEKLY' | 'MONTHLY'; activeWindow: number }>({ processingPeriod: 'WEEKLY', activeWindow: 8 });

  const profileValid = Object.values(profile).every((v) => v.trim());
  const platformsValid = platforms.some((p) => p.enabled);

  const canNext = step === 0 ? profileValid : step === 1 ? platformsValid : true;

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const instance = await api.post<{ id: string }>('/instances', {
        ...profile,
        ...processing,
        platforms,
      });
      router.push(`/instances/${instance.id}/inputs`);
    } catch {
      toast.error('Error al crear la instancia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-8">Nueva instancia</h1>
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && <StepProfile data={profile} onChange={setProfile} />}
      {step === 1 && <StepPlatforms platforms={platforms} onChange={setPlatforms} />}
      {step === 2 && <StepProcessing data={processing} onChange={setProcessing} />}
      {step === 3 && (
        <StepSummary profile={profile} platforms={platforms} processing={processing} onEdit={setStep} />
      )}

      <div className="flex justify-between mt-8 max-w-2xl">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-horse-gray-500 hover:text-horse-black transition-colors"
            >
              Atras
            </button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="px-6 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creando...' : 'Crear instancia'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
