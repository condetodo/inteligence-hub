'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CostData, CostRun } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import { ChevronDown, ChevronRight, ChevronLeft, DollarSign, Zap, TrendingUp } from 'lucide-react';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatCost(cost: number) {
  return `$${cost.toFixed(4)}`;
}

function formatTokens(tokens: number) {
  return tokens.toLocaleString('es-AR');
}

function shortModel(model: string) {
  if (model.includes('opus')) return 'Opus';
  if (model.includes('sonnet')) return 'Sonnet';
  if (model.includes('gemini')) return 'Gemini';
  return model;
}

const stepLabels: Record<string, string> = {
  corpus: 'Corpus Builder',
  distillation: 'Distillation',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  blog: 'Blog',
  insights: 'Insights',
  consistency: 'Consistency',
  image: 'Image Gen',
};

function SummaryCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-horse-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-horse-gray-400 text-xs font-medium mb-2">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-2xl font-bold text-horse-black">{value}</div>
      {sub && <div className="text-xs text-horse-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function RunRow({ run }: { run: CostRun }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(run.startedAt);
  const dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="border-b border-horse-gray-100 hover:bg-horse-gray-50 cursor-pointer transition-colors"
      >
        <td className="py-3 px-4">
          {expanded ? <ChevronDown size={14} className="text-horse-gray-400" /> : <ChevronRight size={14} className="text-horse-gray-400" />}
        </td>
        <td className="py-3 px-4 text-sm font-medium text-horse-black">Semana {run.weekNumber}</td>
        <td className="py-3 px-4 text-xs text-horse-gray-500">{dateStr}</td>
        <td className="py-3 px-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
            run.status === 'FAILED' ? 'bg-red-50 text-red-600' :
            'bg-amber-50 text-amber-600'
          }`}>{run.status}</span>
        </td>
        <td className="py-3 px-4 text-xs text-horse-gray-500 text-right">{formatTokens(run.totalInputTokens + run.totalOutputTokens)}</td>
        <td className="py-3 px-4 text-sm font-semibold text-horse-black text-right">{formatCost(run.totalCost)}</td>
      </tr>
      {expanded && run.steps.map((step, i) => (
        <tr key={i} className="bg-horse-gray-50 border-b border-horse-gray-100">
          <td className="py-2 px-4"></td>
          <td className="py-2 px-4 text-xs text-horse-gray-500 pl-8">{stepLabels[step.stepName] || step.stepName}</td>
          <td className="py-2 px-4">
            <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px] font-medium">{shortModel(step.model)}</span>
          </td>
          <td className="py-2 px-4 text-[11px] text-horse-gray-400">
            {formatTokens(step.inputTokens)} in / {formatTokens(step.outputTokens)} out
          </td>
          <td className="py-2 px-4"></td>
          <td className="py-2 px-4 text-xs text-horse-gray-500 text-right">{formatCost(step.cost)}</td>
        </tr>
      ))}
    </>
  );
}

export default function CostsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<CostData>(`/instances/${id}/costs?month=${month}&year=${year}`);
      setData(result);
    } catch {
      toast.error('Error al cargar costos');
    } finally {
      setLoading(false);
    }
  }, [id, month, year, toast]);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  if (loading) return <PageLoader message="Cargando costos..." />;

  const summary = data?.summary || { totalCost: 0, totalRuns: 0, avgCostPerRun: 0 };

  return (
    <div>
      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-horse-gray-300 hover:text-horse-dark transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="bg-horse-black text-white text-sm font-medium px-4 py-2 rounded-lg">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-horse-gray-300 hover:text-horse-dark transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={DollarSign} label="Costo total" value={formatCost(summary.totalCost)} sub="USD estimado" />
        <SummaryCard icon={Zap} label="Procesamientos" value={String(summary.totalRuns)} sub="este mes" />
        <SummaryCard icon={TrendingUp} label="Promedio por run" value={formatCost(summary.avgCostPerRun)} sub="USD por procesamiento" />
      </div>

      {/* Runs table */}
      {data?.runs.length ? (
        <div className="bg-white border border-horse-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-horse-gray-200 bg-horse-gray-50">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-horse-gray-500 uppercase">Periodo</th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-horse-gray-500 uppercase">Fecha</th>
                <th className="py-3 px-4 text-left text-[11px] font-semibold text-horse-gray-500 uppercase">Estado</th>
                <th className="py-3 px-4 text-right text-[11px] font-semibold text-horse-gray-500 uppercase">Tokens</th>
                <th className="py-3 px-4 text-right text-[11px] font-semibold text-horse-gray-500 uppercase">Costo</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => (
                <RunRow key={run.runId} run={run} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-horse-gray-200 rounded-xl p-12 text-center">
          <p className="text-horse-gray-400 text-sm">Sin datos de costos para este periodo</p>
        </div>
      )}
    </div>
  );
}
