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
import { Trash2 } from 'lucide-react';

const STEPS = ['Perfil', 'Brand Voice', 'Documentos', 'Plataformas', 'Procesamiento', 'Resumen'];

const defaultPlatforms: PlatformConfig[] = [
  { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
  { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
  { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
  { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
];

interface BrandVoiceData {
  identity: string;
  valueProposition: string;
  audience: string;
  voiceTone: {
    adjectives: string;
    examples: string;
    antiPatterns: string;
  };
  positioning: string;
  metrics: string;
}

interface StrategicDoc {
  label: string;
  content: string;
}

const emptyBrandVoice: BrandVoiceData = {
  identity: '',
  valueProposition: '',
  audience: '',
  voiceTone: { adjectives: '', examples: '', antiPatterns: '' },
  positioning: '',
  metrics: '',
};

export default function NewInstancePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    name: '', clientName: '', clientRole: '', company: '', industry: '',
  });
  const [brandVoice, setBrandVoice] = useState<BrandVoiceData>(emptyBrandVoice);
  const [strategicDocs, setStrategicDocs] = useState<StrategicDoc[]>([]);
  const [docLabel, setDocLabel] = useState('');
  const [docContent, setDocContent] = useState('');
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(defaultPlatforms);
  const [processing, setProcessing] = useState<{ processingPeriod: 'WEEKLY' | 'MONTHLY'; activeWindow: number }>({ processingPeriod: 'WEEKLY', activeWindow: 8 });

  const profileValid = Object.values(profile).every((v) => v.trim());
  const platformsValid = platforms.some((p) => p.enabled);

  // Steps 1 (Brand Voice) and 2 (Docs) are optional — always allow next
  const canNext = step === 0 ? profileValid : step === 3 ? platformsValid : true;

  const hasBrandVoiceData = () => {
    return brandVoice.identity.trim() ||
      brandVoice.valueProposition.trim() ||
      brandVoice.audience.trim() ||
      brandVoice.voiceTone.adjectives.trim() ||
      brandVoice.voiceTone.examples.trim() ||
      brandVoice.voiceTone.antiPatterns.trim() ||
      brandVoice.positioning.trim() ||
      brandVoice.metrics.trim();
  };

  const addDoc = () => {
    if (!docLabel.trim() || !docContent.trim()) return;
    setStrategicDocs([...strategicDocs, { label: docLabel.trim(), content: docContent.trim() }]);
    setDocLabel('');
    setDocContent('');
  };

  const removeDoc = (index: number) => {
    setStrategicDocs(strategicDocs.filter((_, i) => i !== index));
  };

  const updateBrandVoice = (key: keyof BrandVoiceData, value: string) => {
    setBrandVoice({ ...brandVoice, [key]: value });
  };

  const updateVoiceTone = (key: keyof BrandVoiceData['voiceTone'], value: string) => {
    setBrandVoice({ ...brandVoice, voiceTone: { ...brandVoice.voiceTone, [key]: value } });
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const instance = await api.post<{ id: string }>('/instances', {
        ...profile,
        ...processing,
        platforms,
      });

      // Save brand voice if any data was provided
      if (hasBrandVoiceData()) {
        await api.put(`/instances/${instance.id}/brand-voice`, {
          identity: brandVoice.identity,
          valueProposition: brandVoice.valueProposition,
          audience: brandVoice.audience,
          voiceTone: {
            adjectives: brandVoice.voiceTone.adjectives,
            examples: brandVoice.voiceTone.examples,
            antiPatterns: brandVoice.voiceTone.antiPatterns,
          },
          positioning: brandVoice.positioning,
          metrics: brandVoice.metrics,
        });
      }

      // Save strategic docs
      for (const doc of strategicDocs) {
        await api.post(`/instances/${instance.id}/inputs`, {
          type: 'STRATEGIC_DOC',
          label: doc.label,
          rawText: doc.content,
        });
      }

      router.push(`/instances/${instance.id}/inputs`);
    } catch {
      toast.error('Error al crear la instancia');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black transition-colors';
  const textareaClass = 'w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black transition-colors resize-y min-h-[80px]';
  const labelClass = 'block text-sm font-medium text-horse-gray-700 mb-1';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-8">Nueva instancia</h1>
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && <StepProfile data={profile} onChange={setProfile} />}

      {step === 1 && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className={labelClass}>Identidad</label>
            <textarea
              value={brandVoice.identity}
              onChange={(e) => updateBrandVoice('identity', e.target.value)}
              placeholder="Describe quién es el cliente, su trayectoria y qué lo define..."
              className={textareaClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>Propuesta de valor</label>
            <textarea
              value={brandVoice.valueProposition}
              onChange={(e) => updateBrandVoice('valueProposition', e.target.value)}
              placeholder="¿Cuál es la propuesta de valor principal del cliente?"
              className={textareaClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>Audiencia</label>
            <textarea
              value={brandVoice.audience}
              onChange={(e) => updateBrandVoice('audience', e.target.value)}
              placeholder="¿A quién le habla? Describe su audiencia ideal..."
              className={textareaClass}
              rows={3}
            />
          </div>

          <div className="border border-horse-gray-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-horse-gray-700">Tono de voz</h4>
            <div>
              <label className={labelClass}>Adjetivos (separados por coma)</label>
              <input
                value={brandVoice.voiceTone.adjectives}
                onChange={(e) => updateVoiceTone('adjectives', e.target.value)}
                placeholder="Ej: profesional, cercano, directo, inspirador"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ejemplos de tono</label>
              <textarea
                value={brandVoice.voiceTone.examples}
                onChange={(e) => updateVoiceTone('examples', e.target.value)}
                placeholder="Ejemplos de frases o mensajes que reflejan el tono deseado..."
                className={textareaClass}
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>Anti-patrones (qué evitar)</label>
              <textarea
                value={brandVoice.voiceTone.antiPatterns}
                onChange={(e) => updateVoiceTone('antiPatterns', e.target.value)}
                placeholder="Frases, palabras o estilos que NO debe usar..."
                className={textareaClass}
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Posicionamiento</label>
            <textarea
              value={brandVoice.positioning}
              onChange={(e) => updateBrandVoice('positioning', e.target.value)}
              placeholder="¿Cómo se diferencia de otros en su industria?"
              className={textareaClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>Métricas</label>
            <textarea
              value={brandVoice.metrics}
              onChange={(e) => updateBrandVoice('metrics', e.target.value)}
              placeholder="¿Qué KPIs de comunicación son importantes?"
              className={textareaClass}
              rows={3}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 max-w-lg">
          <p className="text-sm text-horse-gray-500">
            Sube documentos estratégicos: brief del cliente, análisis de mercado, plan de comunicación
          </p>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>Nombre del documento</label>
              <input
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
                placeholder="Ej: Brief Q1 2025"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contenido</label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Pega el contenido del documento aquí..."
                className={textareaClass}
                rows={6}
              />
            </div>
            <button
              onClick={addDoc}
              disabled={!docLabel.trim() || !docContent.trim()}
              className="px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Agregar documento
            </button>
          </div>

          {strategicDocs.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-semibold text-horse-gray-700">Documentos agregados</h4>
              {strategicDocs.map((doc, i) => (
                <div key={i} className="flex items-center justify-between border border-horse-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-horse-gray-600">{doc.label}</span>
                  <button onClick={() => removeDoc(i)} className="text-horse-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && <StepPlatforms platforms={platforms} onChange={setPlatforms} />}
      {step === 4 && <StepProcessing data={processing} onChange={setProcessing} />}
      {step === 5 && (
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
        <div className="flex gap-3">
          {(step === 1 || step === 2) && (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 text-sm text-horse-gray-500 hover:text-horse-black transition-colors"
            >
              Completar después
            </button>
          )}
          {step < 5 ? (
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
