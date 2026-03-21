'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekLabel, prevWeek, nextWeek } from '@/lib/weeks';

interface Props {
  year: number;
  weekNumber: number;
  onChange: (year: number, weekNumber: number) => void;
}

export default function WeekSelector({ year, weekNumber, onChange }: Props) {
  const handlePrev = () => {
    const p = prevWeek(year, weekNumber);
    onChange(p.year, p.weekNumber);
  };
  const handleNext = () => {
    const n = nextWeek(year, weekNumber);
    onChange(n.year, n.weekNumber);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={handlePrev} className="w-7 h-7 flex items-center justify-center rounded-md border border-horse-gray-200 text-horse-gray-400 hover:border-horse-black hover:text-horse-black transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="bg-horse-black text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium">
        {formatWeekLabel(year, weekNumber)}
      </span>
      <button onClick={handleNext} className="w-7 h-7 flex items-center justify-center rounded-md border border-horse-gray-200 text-horse-gray-400 hover:border-horse-black hover:text-horse-black transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
