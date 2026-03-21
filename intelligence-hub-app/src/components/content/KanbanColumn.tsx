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
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onCardClick?: (item: ContentOutput) => void;
}

export default function KanbanColumn({ status, items, allItems, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  const getSiblings = (item: ContentOutput) =>
    allItems.filter((i) => i.platform === item.platform && i.title === item.title && i.status === item.status);

  return (
    <div className="bg-white border border-horse-gray-200 rounded-xl min-h-[500px]">
      <div className="px-4 py-3.5 border-b border-horse-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-horse-dark">
          <StatusDot status={status} />
          {columnLabels[status]}
        </div>
        <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded-full text-[11px] font-semibold">
          {items.length}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            siblings={getSiblings(item)}
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
