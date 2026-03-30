'use client';

import { useState } from 'react';
import { BrandVoice } from '@/lib/types';
import { Save } from 'lucide-react';

interface Props {
  data: BrandVoice;
  onSave: (data: Partial<BrandVoice>) => Promise<void>;
  readOnly?: boolean;
}

export default function BrandVoiceForm({ data, onSave, readOnly = false }: Props) {
  const [form, setForm] = useState({
    identity: data.identity || '',
    valueProposition: data.valueProposition || '',
    audience: data.audience || '',
    voiceTone: {
      adjectives: data.voiceTone?.adjectives || [],
      examples: data.voiceTone?.examples || [],
      antiPatterns: data.voiceTone?.antiPatterns || [],
    },
    recurringTopics: data.recurringTopics || [],
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

      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <label className="block text-sm font-semibold text-horse-black mb-2">Temas Recurrentes (uno por linea)</label>
        <textarea
          value={form.recurringTopics.join('\n')}
          onChange={(e) => setForm((prev) => ({
            ...prev,
            recurringTopics: e.target.value.split('\n').filter(Boolean),
          }))}
          disabled={readOnly}
          rows={5}
          className={`w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none ${readOnly ? 'bg-horse-gray-50 cursor-not-allowed' : ''}`}
        />
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
