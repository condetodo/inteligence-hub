"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instance } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface InstanceTopbarProps {
  instance: Instance;
}

export function InstanceTopbar({ instance }: InstanceTopbarProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await api.post(`/instances/${instance.id}/process`);
      router.refresh();
    } catch {
      alert("Error al iniciar procesamiento");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[68px] border-b border-horse-gray-200 flex items-center justify-between px-8 bg-white">
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
