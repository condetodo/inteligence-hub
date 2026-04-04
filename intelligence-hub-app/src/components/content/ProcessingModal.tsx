'use client';

import { useState } from 'react';

interface ProcessingConfig {
  contentTypes: string[];
  milestone?: { description: string; tone: string };
  directives?: string;
  platforms: string[];
}

interface PlatformOption {
  platform: string;
  enabled: boolean;
  postsPerPeriod: number;
}

interface ProcessingModalProps {
  instanceId: string;
  platforms: PlatformOption[];
  onClose: () => void;
  onSubmit: (config: ProcessingConfig) => void;
  submitting?: boolean;
}

const TONE_OPTIONS = ['Celebración', 'Informativo', 'Reflexivo', 'Inspiracional'];

export default function ProcessingModal({ platforms, onClose, onSubmit, submitting }: ProcessingModalProps) {
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [milestoneTone, setMilestoneTone] = useState(TONE_OPTIONS[0]);
  const [directives, setDirectives] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    platforms.filter((p) => p.enabled).map((p) => p.platform)
  );

  const toggleContentType = (type: string) => {
    setContentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const canSubmit = contentTypes.length > 0 && selectedPlatforms.length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const config: ProcessingConfig = {
      contentTypes,
      platforms: selectedPlatforms,
    };
    if (contentTypes.includes('milestone') && milestoneDesc.trim()) {
      config.milestone = { description: milestoneDesc.trim(), tone: milestoneTone };
    }
    if (directives.trim()) {
      config.directives = directives.trim();
    }
    onSubmit(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-100">Configurar procesamiento</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Content types */}
          <fieldset>
            <legend className="text-sm font-medium text-zinc-300 mb-2.5">Tipo de contenido</legend>
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={contentTypes.includes('thought_leadership')}
                  onChange={() => toggleContentType('thought_leadership')}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">Thought Leadership</span>
                  <p className="text-xs text-zinc-500">Contenido planificado semanal</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={contentTypes.includes('milestone')}
                  onChange={() => toggleContentType('milestone')}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm text-zinc-200 group-hover:text-white transition-colors">Hito</span>
                  <p className="text-xs text-zinc-500">Contenido vinculado a un evento/logro</p>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Milestone fields */}
          {contentTypes.includes('milestone') && (
            <div className="space-y-3 pl-6 border-l-2 border-zinc-700">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Descripcion del hito</label>
                <textarea
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="Describe el evento o logro..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tono</label>
                <select
                  value={milestoneTone}
                  onChange={(e) => setMilestoneTone(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Directives */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Directivas <span className="text-zinc-500 font-normal">(opcional)</span>
            </label>
            <textarea
              value={directives}
              onChange={(e) => setDirectives(e.target.value)}
              placeholder="Instrucciones especificas para esta generacion..."
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Platforms */}
          <fieldset>
            <legend className="text-sm font-medium text-zinc-300 mb-2.5">Plataformas</legend>
            <div className="flex flex-wrap gap-2">
              {platforms.filter((p) => p.enabled).map((p) => (
                <label
                  key={p.platform}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                    selectedPlatforms.includes(p.platform)
                      ? 'bg-zinc-800 border-blue-500 text-zinc-100'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p.platform)}
                    onChange={() => togglePlatform(p.platform)}
                    className="hidden"
                  />
                  <span>{p.platform}</span>
                  <span className="text-xs text-zinc-500">{p.postsPerPeriod}p</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Procesando...' : 'Procesar'}
          </button>
        </div>
      </div>
    </div>
  );
}
