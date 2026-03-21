import { InsightReport as InsightReportType } from '@/lib/types';
import { Lightbulb, TrendingUp, HelpCircle, Target } from 'lucide-react';

interface Props {
  report: InsightReportType;
}

export default function InsightReport({ report }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-3">Resumen Ejecutivo</h3>
        <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.executiveSummary}</p>
      </div>

      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-4 flex items-center gap-2">
          <Target size={16} className="text-status-review" /> Top 3 Temas
        </h3>
        <div className="space-y-4">
          {report.topTopics.map((topic, i) => (
            <div key={i} className="border-l-2 border-status-review pl-4">
              <div className="text-sm font-medium text-horse-black">{topic.topic}</div>
              <div className="text-xs text-horse-gray-500 mt-1 leading-relaxed">{topic.evidence}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-horse-black mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-status-draft" /> Oportunidad Destacada
          </h3>
          <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.opportunity}</p>
        </div>

        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-horse-black mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-status-approved" /> Evolucion
          </h3>
          <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.evolution}</p>
        </div>
      </div>

      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-4 flex items-center gap-2">
          <HelpCircle size={16} className="text-horse-gray-500" /> Preguntas para el Cliente
        </h3>
        <div className="space-y-3">
          {report.questions.map((q, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-horse-gray-100 text-horse-gray-500 flex items-center justify-center text-xs font-semibold flex-shrink-0">{i + 1}</span>
              <p className="text-sm text-horse-gray-700 leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-3">Recomendaciones</h3>
        <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.recommendations}</p>
      </div>
    </div>
  );
}
