'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ContentOutput, ContentStatus, Platform, Variant, ProcessingRun } from '@/lib/types';
import { getCurrentWeek } from '@/lib/weeks';
import { api } from '@/lib/api';
import WeekSelector from '@/components/ui/WeekSelector';
import PlatformFilter from '@/components/content/PlatformFilter';
import StatsBar from '@/components/content/StatsBar';
import ProcessingBanner from '@/components/content/ProcessingBanner';
import KanbanBoard from '@/components/content/KanbanBoard';
import ContentModal from '@/components/content/ContentModal';

export default function ContentPage() {
  const { id } = useParams<{ id: string }>();
  const [week, setWeek] = useState(getCurrentWeek);
  const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
  const [items, setItems] = useState<ContentOutput[]>([]);
  const [latestRun, setLatestRun] = useState<ProcessingRun | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        week: String(week.weekNumber),
        year: String(week.year),
      });
      if (platform !== 'ALL') params.set('platform', platform);

      const [contentRes, runsRes] = await Promise.all([
        api.get<ContentOutput[]>(`/instances/${id}/content?${params}`),
        api.get<ProcessingRun[]>(`/instances/${id}/runs?limit=1`),
      ]);
      setItems(contentRes);
      setLatestRun(runsRes[0] || null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  }, [id, week, platform]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleStatusChange = async (contentId: string, newStatus: ContentStatus) => {
    try {
      await api.patch(`/instances/${id}/content/${contentId}`, { status: newStatus });
      setItems((prev) => prev.map((i) => i.id === contentId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleApprove = (contentId: string) => handleStatusChange(contentId, 'APPROVED');
  const handleReject = (contentId: string) => handleStatusChange(contentId, 'DRAFT');

  const handleSelectVariant = (variant: Variant, groupItems: ContentOutput[]) => {
    const target = groupItems.find((i) => i.variant === variant);
    if (target) setSelectedItem(target);
  };

  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });

  return (
    <div>
      <ProcessingBanner run={latestRun} contentCount={items.length} />
      <StatsBar counts={counts} />

      <div className="flex items-center justify-between mb-5">
        <WeekSelector year={week.year} weekNumber={week.weekNumber} onChange={(y, w) => setWeek({ year: y, weekNumber: w })} />
        <PlatformFilter selected={platform} onChange={setPlatform} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando contenido...</div>
      ) : (
        <KanbanBoard
          items={items}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelectVariant={handleSelectVariant}
          onCardClick={setSelectedItem}
        />
      )}

      <ContentModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
