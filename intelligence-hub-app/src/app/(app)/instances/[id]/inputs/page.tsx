'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { InputFile, InputType } from '@/lib/types';
import { api } from '@/lib/api';
import InputList from '@/components/inputs/InputList';
import UploadModal from '@/components/inputs/UploadModal';
import { Upload } from 'lucide-react';

export default function InputsPage() {
  const { id } = useParams<{ id: string }>();
  const [inputs, setInputs] = useState<InputFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInputs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InputFile[]>(`/instances/${id}/inputs`);
      setInputs(res);
    } catch (err) {
      console.error('Failed to fetch inputs:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInputs(); }, [fetchInputs]);

  const handleUpload = async (data: { content: string; type: InputType; filename: string }) => {
    await api.post(`/instances/${id}/inputs`, data);
    await fetchInputs();
  };

  const handleDelete = async (inputId: string) => {
    await api.delete(`/instances/${id}/inputs/${inputId}`);
    setInputs((prev) => prev.filter((i) => i.id !== inputId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-horse-black">Inputs</h2>
          <p className="text-sm text-horse-gray-400 mt-0.5">{inputs.length} archivos cargados</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black transition-colors"
        >
          <Upload size={16} />
          Subir input
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando inputs...</div>
      ) : (
        <InputList inputs={inputs} onDelete={handleDelete} />
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onSubmit={handleUpload} />
    </div>
  );
}
