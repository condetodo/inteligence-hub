"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { InstanceTopbar } from "@/components/InstanceTopbar";
import { InstanceTabs } from "@/components/InstanceTabs";

export default function InstanceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params.id as string;
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ instance: Instance }>(`/instances/${id}`)
      .then((data) => setInstance(data.instance))
      .catch(() => setInstance(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">Cargando...</span>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">Instancia no encontrada</span>
      </div>
    );
  }

  return (
    <div>
      <InstanceTopbar instance={instance} />
      <InstanceTabs
        instanceId={id}
        counts={{
          content: instance._count?.content,
          inputs: instance._count?.inputs,
        }}
      />
      <div className="p-6 px-8">{children}</div>
    </div>
  );
}
