'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ContentOutput, ContentStatus, Instance, Platform, Variant, ProcessingRun } from '@/lib/types';
import { getCurrentWeek } from '@/lib/weeks';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import WeekSelector from '@/components/ui/WeekSelector';
import PlatformFilter from '@/components/content/PlatformFilter';
import StatsBar from '@/components/content/StatsBar';
import ProcessingBanner from '@/components/content/ProcessingBanner';
import KanbanBoard from '@/components/content/KanbanBoard';
import ContentModal from '@/components/content/ContentModal';

export default function ContentPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [week, setWeek] = useState(getCurrentWeek);
  const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
  const [items, setItems] = useState<ContentOutput[]>([]);
  const [latestRun, setLatestRun] = useState<ProcessingRun | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [platforms, setPlatforms] = useState<{ platform: string; enabled: boolean; postsPerPeriod: number }[]>([]);

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
    } catch {
      toast.error('Error al cargar contenido');
    } finally {
      setLoading(false);
    }
  }, [id, week, platform, toast]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    api.get<Instance>(`/instances/${id}`).then((inst) => {
      setPlatforms(
        (inst.platformConfigs || []).map((pc) => ({
          platform: pc.platform,
          enabled: pc.enabled,
          postsPerPeriod: pc.postsPerPeriod,
        }))
      );
    }).catch(() => {});
  }, [id]);

  const handleStatusChange = async (contentId: string, newStatus: ContentStatus, approvalNotes?: string) => {
    setLoadingIds((prev) => new Set(prev).add(contentId));
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (approvalNotes) body.approvalNotes = approvalNotes;
      const updated = await api.patch<ContentOutput>(`/instances/${id}/content/${contentId}`, body);
      setItems((prev) => prev.map((i) => i.id === contentId ? updated : i));
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(contentId); return next; });
    }
  };

  const nextStatus: Record<string, ContentStatus> = {
    DRAFT: 'REVIEW',
    REVIEW: 'APPROVED',
    APPROVED: 'PUBLISHED',
  };

  const prevStatus: Record<string, ContentStatus> = {
    REVIEW: 'DRAFT',
    APPROVED: 'REVIEW',
  };

  const handleAdvance = (contentId: string, approvalNotes?: string) => {
    const item = items.find((i) => i.id === contentId);
    if (!item) return;
    const next = nextStatus[item.status];
    if (next) handleStatusChange(contentId, next, approvalNotes);
  };

  const handleReject = (contentId: string) => {
    const item = items.find((i) => i.id === contentId);
    if (!item) return;
    const prev = prevStatus[item.status];
    if (prev) handleStatusChange(contentId, prev);
  };

  const handleSelectVariant = (variant: Variant, groupItems: ContentOutput[]) => {
    const target = groupItems.find((i) => i.variant === variant);
    if (target) setSelectedItem(target);
  };

  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });

  return (
    <div>
      <ProcessingBanner run={latestRun} contentCount={items.length} instanceId={id} platforms={platforms} onProcessingStarted={fetchContent} />
      <StatsBar counts={counts} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <WeekSelector year={week.year} weekNumber={week.weekNumber} onChange={(y, w) => setWeek({ year: y, weekNumber: w })} />
        <PlatformFilter selected={platform} onChange={setPlatform} />
      </div>

      {loading ? (
        <PageLoader message="Cargando contenido..." />
      ) : (
        <KanbanBoard
          items={items}
          loadingIds={loadingIds}
          onApprove={handleAdvance}
          onReject={handleReject}
          onSelectVariant={handleSelectVariant}
          onCardClick={setSelectedItem}
        />
      )}

      <ContentModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
