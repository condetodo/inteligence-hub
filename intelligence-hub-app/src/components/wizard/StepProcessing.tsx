'use client';

interface ProcessingData {
  processingPeriod: 'WEEKLY' | 'MONTHLY';
  activeWindow: number;
}

interface Props {
  data: ProcessingData;
  onChange: (data: ProcessingData) => void;
}

export default function StepProcessing({ data, onChange }: Props) {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-2">Periodo de procesamiento</label>
        <div className="flex gap-3">
          {(['WEEKLY', 'MONTHLY'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onChange({ ...data, processingPeriod: period })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                data.processingPeriod === period
                  ? 'bg-horse-black text-white border-horse-black'
                  : 'bg-white text-horse-gray-500 border-horse-gray-200 hover:border-horse-gray-400'
              }`}
            >
              {period === 'WEEKLY' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-1">Ventana activa</label>
        <p className="text-xs text-horse-gray-400 mb-2">
          Cuantos periodos pasados usa el AI como memoria para detectar patrones y tendencias.
        </p>
        <input
          type="number"
          min={4}
          max={16}
          value={data.activeWindow}
          onChange={(e) => onChange({ ...data, activeWindow: Number(e.target.value) })}
          className="w-24 px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black"
        />
        <span className="text-sm text-horse-gray-400 ml-2">periodos</span>
      </div>
    </div>
  );
}
