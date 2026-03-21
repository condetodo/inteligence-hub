import { ContentStatus } from '@/lib/types';

const colors: Record<ContentStatus, string> = {
  DRAFT: 'bg-status-draft',
  REVIEW: 'bg-status-review',
  APPROVED: 'bg-status-approved',
  PUBLISHED: 'bg-status-published',
};

export default function StatusDot({ status }: { status: ContentStatus }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}
