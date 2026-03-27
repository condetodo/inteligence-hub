'use client';

import { useState } from 'react';
import { InputType } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

const inputTypes: { value: InputType; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'NOTE', label: 'Nota' },
  { value: 'INTERVIEW', label: 'Entrevista' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'MEETING', label: 'Reunion' },
  { value: 'ARTICLE', label: 'Articulo' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; type: InputType; filename: string }) => Promise<void>;
}

export default function UploadModal({ open, onClose, onSubmit }: Props) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<InputType>('WHATSAPP');
  const [filename, setFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !filename.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ content, type, filename });
      setContent('');
      setFilename('');
      setType('WHATSAPP');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Subir input">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Nombre del archivo</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="conversacion-cliente-mar2026.txt"
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InputType)}
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors bg-white"
          >
            {inputTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Contenido</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Pegar el contenido del WhatsApp, email, nota, etc..."
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-horse-gray-500 hover:text-horse-black transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || !filename.trim() || submitting}
            className="px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Subiendo...' : 'Subir input'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
