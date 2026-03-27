'use client';
import { Linkedin, Twitter, Video, FileText } from 'lucide-react';

export interface PlatformConfig {
  platform: string;
  enabled: boolean;
  postsPerPeriod: number;
  threadsPerPeriod: number | null;
}

interface Props {
  platforms: PlatformConfig[];
  onChange: (platforms: PlatformConfig[]) => void;
}

const platformMeta: Record<string, { label: string; icon: any; color: string; hasThreads: boolean; maxPosts: number; maxThreads: number }> = {
  LINKEDIN: { label: 'LinkedIn', icon: Linkedin, color: 'text-sky-600', hasThreads: false, maxPosts: 5, maxThreads: 0 },
  X: { label: 'X / Twitter', icon: Twitter, color: 'text-gray-800', hasThreads: true, maxPosts: 5, maxThreads: 2 },
  TIKTOK: { label: 'TikTok', icon: Video, color: 'text-pink-500', hasThreads: false, maxPosts: 4, maxThreads: 0 },
  BLOG: { label: 'Blog', icon: FileText, color: 'text-orange-500', hasThreads: false, maxPosts: 3, maxThreads: 0 },
};

const contentLabel: Record<string, string> = {
  LINKEDIN: 'Posts por periodo',
  X: 'Tweets por periodo',
  TIKTOK: 'Scripts por periodo',
  BLOG: 'Articulos por periodo',
};

export default function StepPlatforms({ platforms, onChange }: Props) {
  const toggle = (idx: number) => {
    const updated = [...platforms];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    onChange(updated);
  };

  const updateField = (idx: number, field: string, value: number) => {
    const updated = [...platforms];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      {platforms.map((p, idx) => {
        const meta = platformMeta[p.platform];
        const Icon = meta.icon;
        return (
          <div
            key={p.platform}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              p.enabled ? 'border-horse-black bg-white' : 'border-horse-gray-200 bg-horse-gray-50 opacity-60'
            }`}
            onClick={() => toggle(idx)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={20} className={meta.color} />
                <span className="font-medium text-sm">{meta.label}</span>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors flex items-center ${
                  p.enabled ? 'bg-horse-black justify-end' : 'bg-horse-gray-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full mx-0.5" />
              </div>
            </div>
            {p.enabled && (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="text-xs text-horse-gray-500">{contentLabel[p.platform]}</label>
                  <input
                    type="number"
                    min={1}
                    max={meta.maxPosts}
                    value={p.postsPerPeriod}
                    onChange={(e) => updateField(idx, 'postsPerPeriod', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-horse-gray-200 rounded-lg text-sm mt-1 focus:outline-none focus:border-horse-black"
                  />
                </div>
                {meta.hasThreads && (
                  <div>
                    <label className="text-xs text-horse-gray-500">Threads por periodo</label>
                    <input
                      type="number"
                      min={0}
                      max={meta.maxThreads}
                      value={p.threadsPerPeriod ?? 0}
                      onChange={(e) => updateField(idx, 'threadsPerPeriod', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-horse-gray-200 rounded-lg text-sm mt-1 focus:outline-none focus:border-horse-black"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
