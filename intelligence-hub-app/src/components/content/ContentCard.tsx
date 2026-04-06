'use client';

import { useState } from 'react';
import { ContentOutput, Variant } from '@/lib/types';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { Check, X, Send, Loader2 } from 'lucide-react';

interface Props {
  item: ContentOutput;
  siblings?: ContentOutput[];
  loading?: boolean;
  onApprove?: (id: string, approvalNotes?: string) => void;
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

function ConsistencyBadge({ score, notes }: { score: number; notes: string | null }) {
  const color =
    score >= 7
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : score >= 5
        ? 'bg-amber-50 text-amber-600 border-amber-200'
        : 'bg-red-50 text-red-600 border-red-200';

  return (
    <div
      className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${color}`}
      title={notes || ''}
    >
      BV: {score.toFixed(1)}
    </div>
  );
}

export default function ContentCard({ item, siblings, loading, onApprove, onReject, onSelectVariant, onClick }: Props) {
  const variants: Variant[] = ['A', 'B', 'C'];
  const hasVariants = siblings && siblings.length > 1;

  const [showApprovalNotes, setShowApprovalNotes] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const isReviewApprove = item.status === 'REVIEW';

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReviewApprove && !showApprovalNotes) {
      setShowApprovalNotes(true);
      return;
    }
    onApprove?.(item.id);
  };

  const handleConfirmApproval = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApprove?.(item.id, approvalNotes || undefined);
    setShowApprovalNotes(false);
    setApprovalNotes('');
  };

  const handleCancelApproval = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowApprovalNotes(false);
    setApprovalNotes('');
  };

  return (
    <div
      onClick={() => onClick?.(item)}
      className="bg-white border border-horse-gray-200 rounded-[10px] p-3.5 cursor-pointer transition-all hover:border-horse-gray-300 hover:shadow-md hover:-translate-y-px"
    >
      <div className="flex items-center justify-between gap-2">
        <PlatformBadge platform={item.platform} />
        {item.consistencyScore !== null && item.consistencyScore !== undefined && (
          <ConsistencyBadge score={item.consistencyScore} notes={item.consistencyNotes} />
        )}
      </div>

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
              onClick={handleApproveClick}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-colors"
              title="Enviar a revision"
            >
              <Check size={14} />
            </button>
          )}
          {item.status === 'REVIEW' && onApprove && (
            <button
              onClick={handleApproveClick}
              disabled={loading}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-status-approved hover:text-status-approved hover:bg-[#2a9d5c]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={loading ? 'Generando imagen...' : 'Aprobar'}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
          )}
          {(item.status === 'REVIEW' || item.status === 'APPROVED') && onReject && (
            <button
              onClick={(e) => { e.stopPropagation(); onReject(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Volver atras"
            >
              <X size={14} />
            </button>
          )}
          {item.status === 'APPROVED' && onApprove && (
            <button
              onClick={handleApproveClick}
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

      {showApprovalNotes && (
        <div className="mt-3 pt-3 border-t border-horse-gray-200" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Notas de aprobacion (opcional)..."
            className="w-full text-xs bg-horse-gray-50 border border-horse-gray-200 rounded-lg px-3 py-2 text-horse-dark placeholder:text-horse-gray-400 focus:outline-none focus:border-horse-gray-300 resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancelApproval}
              className="text-[11px] font-medium text-horse-gray-400 hover:text-horse-gray-600 px-2.5 py-1 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmApproval}
              disabled={loading}
              className="text-[11px] font-medium text-white bg-horse-black hover:bg-horse-dark px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              {loading ? 'Generando imagen...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
