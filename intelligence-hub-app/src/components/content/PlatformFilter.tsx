'use client';

import { Platform } from '@/lib/types';

const filters: { value: Platform | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'X', label: 'X' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'BLOG', label: 'Blog' },
];

interface Props {
  selected: Platform | 'ALL';
  onChange: (value: Platform | 'ALL') => void;
}

export default function PlatformFilter({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected === f.value
              ? 'bg-horse-gold text-horse-black border-horse-gold font-semibold'
              : 'border-horse-warm-border text-horse-warm-text hover:border-[#d4c8b0] hover:text-horse-black'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
