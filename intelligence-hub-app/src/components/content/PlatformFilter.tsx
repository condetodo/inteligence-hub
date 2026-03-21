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
              ? 'bg-horse-black text-white border-horse-black'
              : 'border-horse-gray-200 text-horse-gray-500 hover:border-horse-dark hover:text-horse-dark'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
