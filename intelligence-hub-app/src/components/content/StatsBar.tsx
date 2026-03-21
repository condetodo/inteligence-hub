interface Props {
  counts: Record<string, number>;
}

const stats = [
  { key: 'DRAFT', label: 'Borradores', colorClass: 'text-status-draft' },
  { key: 'REVIEW', label: 'En revision', colorClass: 'text-status-review' },
  { key: 'APPROVED', label: 'Aprobados', colorClass: 'text-status-approved' },
  { key: 'PUBLISHED', label: 'Publicados', colorClass: 'text-horse-black' },
];

export default function StatsBar({ counts }: Props) {
  return (
    <div className="flex gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.key} className="bg-white border border-horse-gray-200 rounded-[10px] px-5 py-4 flex-1">
          <div className="text-xs text-horse-gray-400 font-medium mb-1">{s.label}</div>
          <div className={`text-[28px] font-bold ${s.colorClass}`}>{counts[s.key] || 0}</div>
        </div>
      ))}
    </div>
  );
}
