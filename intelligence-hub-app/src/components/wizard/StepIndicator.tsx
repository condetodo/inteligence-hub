'use client';
import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < current
                  ? 'bg-horse-black text-white'
                  : i === current
                  ? 'bg-horse-black text-white'
                  : 'bg-horse-gray-100 text-horse-gray-400'
              }`}
            >
              {i < current ? <Check size={16} /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 ${i <= current ? 'text-horse-black font-medium' : 'text-horse-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-px mx-2 mb-5 ${i < current ? 'bg-horse-black' : 'bg-horse-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
