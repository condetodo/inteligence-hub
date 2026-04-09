import { ContentOutput, ContentStatus, Variant } from '@/lib/types';
import StatusDot from '@/components/ui/StatusDot';
import ContentCard from './ContentCard';

const columnLabels: Record<ContentStatus, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'En revision',
  APPROVED: 'Aprobado',
  PUBLISHED: 'Publicado',
};

interface Props {
  status: ContentStatus;
  items: ContentOutput[];
  allItems: ContentOutput[];
  loadingIds?: Set<string>;
  onApprove?: (id: string, approvalNotes?: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onCardClick?: (item: ContentOutput) => void;
}

const columnStyles: Record<ContentStatus, { bg: string; border: string; countBadge: string }> = {
  DRAFT: {
    bg: 'bg-gradient-to-b from-[#fef8e0] via-[#fffdf7] to-white',
    border: 'border-[#ede0b0]',
    countBadge: 'bg-[#fef3c7] text-[#92400e]',
  },
  REVIEW: {
    bg: 'bg-gradient-to-b from-[#edf3ff] via-[#f8faff] to-white',
    border: 'border-[#c8d8f0]',
    countBadge: 'bg-[#dbeafe] text-[#1e40af]',
  },
  APPROVED: {
    bg: 'bg-gradient-to-b from-[#edfbf2] via-[#f7fdf9] to-white',
    border: 'border-[#bce8cc]',
    countBadge: 'bg-[#d1fae5] text-[#065f46]',
  },
  PUBLISHED: {
    bg: 'bg-gradient-to-b from-[#f5f5f2] via-[#fafaf8] to-white',
    border: 'border-[#e0e0da]',
    countBadge: 'bg-[#f0f0ee] text-[#555]',
  },
};

export default function KanbanColumn({ status, items, allItems, loadingIds, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  const getSiblings = (item: ContentOutput) =>
    allItems.filter((i) => i.platform === item.platform && i.title === item.title && i.status === item.status);

  const style = columnStyles[status];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl min-h-[500px]`}>
      <div className={`px-4 py-3.5 border-b ${style.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-horse-black">
          <StatusDot status={status} />
          {columnLabels[status]}
        </div>
        <span className={`${style.countBadge} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
          {items.length}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            siblings={getSiblings(item)}
            loading={loadingIds?.has(item.id)}
            onApprove={onApprove}
            onReject={onReject}
            onSelectVariant={onSelectVariant}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
