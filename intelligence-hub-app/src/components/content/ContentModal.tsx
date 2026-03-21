'use client';

import { useState } from 'react';
import { ContentOutput } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { Copy, Download, Check } from 'lucide-react';

interface Props {
  item: ContentOutput | null;
  open: boolean;
  onClose: () => void;
}

export default function ContentModal({ item, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!item.imageUrl) return;
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `${item.title.slice(0, 40).replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} title={item.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PlatformBadge platform={item.platform} />
          <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px] font-medium uppercase">{item.type}</span>
          <span className="text-horse-gray-400 text-xs">Variante {item.variant}</span>
        </div>

        {item.imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-horse-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="w-full object-cover max-h-80" />
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm text-horse-black leading-relaxed bg-horse-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
          {item.content}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </button>
          {item.imageUrl && (
            <button onClick={handleDownloadImage} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-horse-gray-300 text-horse-dark text-sm font-medium hover:border-horse-black hover:text-horse-black transition-colors">
              <Download size={16} />
              Descargar imagen
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
