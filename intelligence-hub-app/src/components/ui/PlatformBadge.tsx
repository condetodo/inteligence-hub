'use client';

import { Platform } from '@/lib/types';

const config: Record<Platform, { label: string; icon: string; classes: string }> = {
  LINKEDIN: { label: 'LinkedIn', icon: 'in', classes: 'bg-[#0a66c2]/10 text-[#0a66c2]' },
  X: { label: 'X', icon: '\u{1D54F}', classes: 'bg-black/5 text-[#1a1a1a]' },
  TIKTOK: { label: 'TikTok', icon: '\u266A', classes: 'bg-[#ff0050]/10 text-[#ff0050]' },
  BLOG: { label: 'Blog', icon: '\u25A4', classes: 'bg-[#2a9d5c]/10 text-[#2a9d5c]' },
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const c = config[platform];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${c.classes}`}>
      {c.icon} {c.label}
    </span>
  );
}
