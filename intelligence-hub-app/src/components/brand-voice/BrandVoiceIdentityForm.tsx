'use client';

import { useState } from 'react';
import { BrandVoice } from '@/lib/types';
import { Save } from 'lucide-react';

interface Props {
  data: BrandVoice;
  onSave: (data: Partial<BrandVoice>) => Promise<void>;
  readOnly?: boolean;
}

export default function BrandVoiceIdentityForm({ data, onSave, readOnly = false }: Props) {
  const [form, setForm] = useState({
    identity: data.identity || '',
    valueProposition: data.valueProposition || '',
    audience: data.audience || '',
    voiceTone: {
      adjectives: data.voiceTone?.adjectives || [],
      examples: data.voiceTone?.examples || [],
      antiPatterns: data.voiceTone?.antiPatterns || [],
    },
    positioning: data.positioning || '',
    metrics: data.metrics || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const sections: { key: string; label: string }[] = [
    { key: 'identity', label: 'Identidad' },
    { key: 'valueProposition', label: 'Propuesta de Valor' },
    { key: 'audience', label: 'Audiencia' },
    { key: 'positioning', label: 'Posicionamiento' },
    { key: 'metrics', label: 'Metricas' },
  ];

  return (
    <div className="space-y-6">
      {data.staticFieldsLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-800">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Estos campos son tu narrativa estrategica. La IA no los modifica.
        </div>
      )}

      {sections.map((s) => (
        <div key={s.key} className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <label className="block text-sm font-semibold text-horse-black mb-2">{s.label}</label>
          <textarea
            value={form[s.key as keyof typeof form] as string}
            onChange={(e) => updateField(s.key, e.target.value)}
            disabled={readOnly}
            rows={4}
            className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm text-horse-gray-700 leading-relaxed focus:outline-none focus:border-horse-black transition-colors resize-none ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
          />
        </div>
      ))}

      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <label className="block text-sm font-semibold text-horse-black mb-3">Voz y Tono</label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Adjetivos (separados por coma)</label>
            <input
              value={form.voiceTone.adjectives.join(', ')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, adjectives: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
              }))}
              disabled={readOnly}
              className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Ejemplos (uno por linea)</label>
            <textarea
              value={form.voiceTone.examples.join('\n')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, examples: e.target.value.split('\n').filter(Boolean) },
              }))}
              disabled={readOnly}
              rows={3}
              className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Anti-patrones (uno por linea)</label>
            <textarea
              value={form.voiceTone.antiPatterns.join('\n')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, antiPatterns: e.target.value.split('\n').filter(Boolean) },
              }))}
              disabled={readOnly}
              rows={3}
              className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  );
}
