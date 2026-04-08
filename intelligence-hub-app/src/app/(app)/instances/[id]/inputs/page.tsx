'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { InputFile, InputType } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import InputList from '@/components/inputs/InputList';
import UploadModal from '@/components/inputs/UploadModal';
import StrategicDocsSection from '@/components/inputs/StrategicDocsSection';
import { Plus, ChevronRight } from 'lucide-react';

type InputTab = 'weekly' | 'strategic';

export default function InputsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [inputs, setInputs] = useState<InputFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InputTab>('weekly');

  const fetchInputs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InputFile[]>(`/instances/${id}/inputs`);
      setInputs(res);
    } catch {
      toast.error('Error al cargar inputs');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchInputs(); }, [fetchInputs]);

  const strategicDocs = useMemo(() => inputs.filter((i) => i.isFoundational), [inputs]);
  const weeklyInputs = useMemo(() => inputs.filter((i) => !i.isFoundational), [inputs]);

  const handleUpload = async (data: { content: string; type: InputType; filename: string }) => {
    await api.post(`/instances/${id}/inputs`, data);
    toast.success('Input subido correctamente');
    await fetchInputs();
  };

  const handleStrategicUpload = async (data: { content: string; label: string }) => {
    await api.post(`/instances/${id}/inputs`, {
      content: data.content,
      type: 'STRATEGIC_DOC' as InputType,
      filename: data.label,
    });
    toast.success('Documento estratégico guardado');
    await fetchInputs();
  };

  const handleDelete = async (inputId: string) => {
    try {
      await api.delete(`/instances/${id}/inputs/${inputId}`);
      setInputs((prev) => prev.filter((i) => i.id !== inputId));
      toast.success('Input eliminado');
    } catch {
      toast.error('Error al eliminar input');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-horse-black">Inputs</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">Material fuente para la generación de contenido</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-horse-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'weekly'
              ? 'bg-white shadow-sm text-horse-black'
              : 'text-horse-gray-400 hover:text-horse-gray-500'
          }`}
        >
          Inputs semanales
          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
            activeTab === 'weekly'
              ? 'bg-horse-gray-200 text-horse-gray-500'
              : 'text-horse-gray-400'
          }`}>
            {weeklyInputs.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('strategic')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'strategic'
              ? 'bg-white shadow-sm text-horse-black'
              : 'text-horse-gray-400 hover:text-horse-gray-500'
          }`}
        >
          Documentos estratégicos
          <span className={`ml-1.5 text-xs ${
            activeTab === 'strategic'
              ? 'bg-horse-gray-200 text-horse-gray-500 px-1.5 py-0.5 rounded-full'
              : 'text-horse-gray-400'
          }`}>
            {strategicDocs.length}
          </span>
        </button>
      </div>

      {loading ? (
        <PageLoader message="Cargando inputs..." />
      ) : (
        <>
          {activeTab === 'weekly' && (
            <>
              {/* CTA subir input */}
              <button
                onClick={() => setShowUpload(true)}
                className="w-full border-2 border-dashed border-horse-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between hover:border-horse-purple/40 hover:bg-horse-purple/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-horse-purple/10 flex items-center justify-center group-hover:bg-horse-purple/20 transition-colors">
                    <Plus size={20} className="text-horse-purple" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-horse-black">Subir nuevo input</p>
                    <p className="text-xs text-horse-gray-400">WhatsApp, emails, notas de reuniones, artículos...</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-horse-gray-300 group-hover:text-horse-purple transition-colors" />
              </button>

              <InputList inputs={weeklyInputs} onDelete={handleDelete} />
            </>
          )}

          {activeTab === 'strategic' && (
            <StrategicDocsSection
              docs={strategicDocs}
              onUpload={handleStrategicUpload}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onSubmit={handleUpload} />
    </div>
  );
}
