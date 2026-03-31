"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instance } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface InstanceTopbarProps {
  instance: Instance;
}

export function InstanceTopbar({ instance }: InstanceTopbarProps) {
  const router = useRouter();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await api.post(`/instances/${instance.id}/process`);
      toast.success("Procesamiento iniciado");
      router.push(`/instances/${instance.id}/history`);
    } catch (err: unknown) {
      const error = err as { message?: string; body?: { error?: string } };
      const msg = error?.body?.error || error?.message || "Error desconocido";
      toast.error(`Error al procesar: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-auto min-h-[68px] border-b border-horse-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-8 py-3 sm:py-0 gap-2 sm:gap-0 bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-horse-black">{instance.clientName}</h1>
        <span className="text-[13px] text-horse-gray-400">
          {instance.company}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="outline" onClick={() => router.push(`/instances/${instance.id}/inputs`)}>
          &uarr; Subir inputs
        </Button>
        <Button onClick={handleProcess} disabled={processing}>
          {processing ? "Procesando..." : "\u26A1 Procesar ahora"}
        </Button>
      </div>
    </div>
  );
}
