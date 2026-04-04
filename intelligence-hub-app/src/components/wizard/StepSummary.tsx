'use client';
import { PlatformConfig } from './StepPlatforms';
import { Pencil } from 'lucide-react';

interface Props {
  profile: { name: string; clientName: string; clientRole: string; company: string; industry: string };
  platforms: PlatformConfig[];
  processing: { processingPeriod: string; activeWindow: number };
  onEdit: (step: number) => void;
}

const platformLabels: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  X: 'X / Twitter',
  TIKTOK: 'TikTok',
  BLOG: 'Blog',
};

const contentLabels: Record<string, string> = {
  LINKEDIN: 'posts',
  X: 'tweets',
  TIKTOK: 'scripts',
  BLOG: 'articulos',
};

export default function StepSummary({ profile, platforms, processing, onEdit }: Props) {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Perfil</h3>
          <button onClick={() => onEdit(0)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-sm text-horse-gray-600">
          {profile.clientName} · {profile.clientRole} · {profile.company} · {profile.industry}
        </p>
        <p className="text-xs text-horse-gray-400 mt-1">Instancia: {profile.name}</p>
      </div>

      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Contenido</h3>
          <button onClick={() => onEdit(3)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {platforms.map((p) => (
            <p key={p.platform} className={`text-sm ${p.enabled ? 'text-horse-gray-600' : 'text-horse-gray-300 line-through'}`}>
              {p.enabled ? '\u2713' : '\u2717'} {platformLabels[p.platform]}
              {p.enabled && (
                <span className="text-horse-gray-400">
                  {' '} — {p.postsPerPeriod} {contentLabels[p.platform]}
                  {p.threadsPerPeriod ? ` + ${p.threadsPerPeriod} threads` : ''}
                  {p.platform === 'LINKEDIN' && ' (con variantes A/B/C)'}
                </span>
              )}
            </p>
          ))}
        </div>
      </div>

      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Procesamiento</h3>
          <button onClick={() => onEdit(4)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-sm text-horse-gray-600">
          {processing.processingPeriod === 'WEEKLY' ? 'Semanal' : 'Mensual'} · Ventana activa: {processing.activeWindow} periodos
        </p>
      </div>
    </div>
  );
}
