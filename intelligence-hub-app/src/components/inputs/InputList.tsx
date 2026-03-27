'use client';

import { InputFile, InputType } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Trash2 } from 'lucide-react';

const typeConfig: Record<InputType, { label: string; color: string }> = {
  WHATSAPP: { label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  EMAIL: { label: 'Email', color: 'bg-blue-100 text-blue-700' },
  AUDIO: { label: 'Audio', color: 'bg-purple-100 text-purple-700' },
  NOTE: { label: 'Nota', color: 'bg-yellow-100 text-yellow-700' },
  INTERVIEW: { label: 'Entrevista', color: 'bg-orange-100 text-orange-700' },
  LINKEDIN: { label: 'LinkedIn', color: 'bg-sky-100 text-sky-700' },
  MEETING: { label: 'Reunion', color: 'bg-indigo-100 text-indigo-700' },
  ARTICLE: { label: 'Articulo', color: 'bg-rose-100 text-rose-700' },
};

interface Props {
  inputs: InputFile[];
  onDelete?: (id: string) => void;
}

export default function InputList({ inputs, onDelete }: Props) {
  if (inputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
        <FileText size={32} className="mb-3 text-horse-gray-300" />
        No hay inputs cargados
      </div>
    );
  }

  return (
    <div className="bg-white border border-horse-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-horse-gray-200 text-left text-horse-gray-400 text-xs">
            <th className="px-4 py-3 font-medium">Archivo</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium w-12"></th>
          </tr>
        </thead>
        <tbody>
          {inputs.map((input) => {
            const tc = typeConfig[input.type];
            return (
              <tr key={input.id} className="border-b border-horse-gray-100 hover:bg-horse-gray-100/50 transition-colors">
                <td className="px-4 py-3 font-medium text-horse-black">{input.filename}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tc.color}`}>{tc.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${input.status === 'PROCESSED' ? 'text-status-approved' : 'text-horse-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${input.status === 'PROCESSED' ? 'bg-status-approved' : 'bg-horse-gray-300'}`} />
                    {input.status === 'PROCESSED' ? 'Procesado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-horse-gray-400 text-xs">
                  {format(new Date(input.uploadedAt), "d MMM yyyy, HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3">
                  {onDelete && (
                    <button onClick={() => onDelete(input.id)} className="text-horse-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
