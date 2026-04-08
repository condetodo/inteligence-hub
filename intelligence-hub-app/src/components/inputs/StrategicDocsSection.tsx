'use client';

import { useState } from 'react';
import { InputFile } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Plus, Trash2, X, ChevronRight } from 'lucide-react';

interface Props {
  docs: InputFile[];
  onUpload: (data: { content: string; label: string }) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function StrategicDocsSection({ docs, onUpload, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !label.trim()) return;
    setSubmitting(true);
    try {
      await onUpload({ content, label });
      setContent('');
      setLabel('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-horse-gray-400 mb-6">
        Documentos fundacionales que se incluyen en cada generación de contenido.
      </p>

      {/* CTA agregar */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full border-2 border-dashed border-horse-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between hover:border-amber-400/40 hover:bg-amber-50/30 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            {showForm ? <X size={20} className="text-amber-600" /> : <Plus size={20} className="text-amber-600" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-horse-black">
              {showForm ? 'Cancelar' : 'Agregar documento estratégico'}
            </p>
            <p className="text-xs text-horse-gray-400">Briefs, análisis de mercado, planes de comunicación...</p>
          </div>
        </div>
        {!showForm && <ChevronRight size={20} className="text-horse-gray-300 group-hover:text-amber-500 transition-colors" />}
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Etiqueta</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Brief de marca, Análisis de mercado Q1..."
              className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Pegar el contenido del documento estratégico..."
              className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || !label.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Guardando...' : 'Guardar documento'}
            </button>
          </div>
        </div>
      )}

      {/* Docs list */}
      {docs.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-horse-gray-400 text-sm">
          <BookOpen size={32} className="mb-3 text-horse-gray-300" />
          <p>No hay documentos estratégicos.</p>
          <p className="text-xs mt-1">Agrega briefs, análisis de mercado o planes de comunicación.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-horse-gray-50 border border-horse-gray-200 rounded-lg px-4 py-3 group hover:border-horse-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen size={16} className="text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-horse-black truncate">
                    {doc.label || doc.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                      Estratégico
                    </span>
                    <span className="text-[11px] text-horse-gray-400">
                      {format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(doc.id)}
                className="text-horse-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
