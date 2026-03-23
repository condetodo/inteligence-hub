'use client';

import { ContentOutput, ContentStatus, Variant } from '@/lib/types';
import KanbanColumn from './KanbanColumn';

const columns: ContentStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'];

interface Props {
  items: ContentOutput[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onCardClick?: (item: ContentOutput) => void;
}

export default function KanbanBoard({ items, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          items={items.filter((i) => i.status === status)}
          allItems={items}
          onApprove={onApprove}
          onReject={onReject}
          onSelectVariant={onSelectVariant}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
