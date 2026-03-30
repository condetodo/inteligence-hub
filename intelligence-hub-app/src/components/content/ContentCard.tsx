'use client';

import { ContentOutput, Variant } from '@/lib/types';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { Check, X, Send } from 'lucide-react';

interface Props {
  item: ContentOutput;
  siblings?: ContentOutput[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onClick?: (item: ContentOutput) => void;
}

const typeLabels: Record<string, string> = {
  POST: 'Post',
  THREAD: 'Hilo',
  SCRIPT: 'Script',
  ARTICLE: 'Articulo',
};

export default function ContentCard({ item, siblings, onApprove, onReject, onSelectVariant, onClick }: Props) {
  const variants: Variant[] = ['A', 'B', 'C'];
  const hasVariants = siblings && siblings.length > 1;

  return (
    <div
      onClick={() => onClick?.(item)}
      className="bg-white border border-horse-gray-200 rounded-[10px] p-3.5 cursor-pointer transition-all hover:border-horse-gray-300 hover:shadow-md hover:-translate-y-px"
    >
      <PlatformBadge platform={item.platform} />

      {hasVariants && (
        <div className="flex gap-1 mt-2 mb-2">
          {variants.map((v) => {
            const exists = siblings.find((s) => s.variant === v);
            if (!exists) return null;
            return (
              <button
                key={v}
                onClick={(e) => { e.stopPropagation(); onSelectVariant?.(v, siblings); }}
                className={`w-6 h-6 rounded-md border text-[10px] font-semibold flex items-center justify-center transition-colors ${
                  item.variant === v
                    ? 'border-horse-black bg-horse-black text-white'
                    : 'border-horse-gray-200 text-horse-gray-400 hover:border-horse-dark'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}

      <div className="text-[13px] font-medium mb-1.5 leading-snug text-horse-black line-clamp-2">{item.title}</div>
      <div className="text-xs text-horse-gray-500 leading-relaxed mb-2.5 line-clamp-2">{item.content.slice(0, 120)}...</div>

      <div className="flex items-center justify-between text-[11px] text-horse-gray-400">
        <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px] font-medium">
          {typeLabels[item.type] || item.type}
        </span>
        <div className="flex gap-1.5">
          {item.status === 'DRAFT' && onApprove && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-colors"
              title="Enviar a revisión"
            >
              <Check size={14} />
            </button>
          )}
          {item.status === 'REVIEW' && onApprove && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-status-approved hover:text-status-approved hover:bg-[#2a9d5c]/5 transition-colors"
              title="Aprobar"
            >
              <Check size={14} />
            </button>
          )}
          {(item.status === 'REVIEW' || item.status === 'APPROVED') && onReject && (
            <button
              onClick={(e) => { e.stopPropagation(); onReject(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Volver atrás"
            >
              <X size={14} />
            </button>
          )}
          {item.status === 'APPROVED' && onApprove && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-horse-black hover:text-horse-black hover:bg-horse-gray-100 transition-colors"
              title="Marcar como publicado"
            >
              <Send size={13} />
            </button>
          )}
          {item.status === 'PUBLISHED' && item.engagement && (
            <span className="text-horse-black font-medium text-[11px]">
              {item.engagement.views} views · {item.engagement.reactions} reactions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
