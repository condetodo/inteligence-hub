"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useInstances } from "@/contexts/InstancesContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { instances, refetch } = useInstances();
  const toast = useToast();
  const [restoring, setRestoring] = useState<string | null>(null);

  const archivedInstances = instances.filter((i) => i.status === "ARCHIVED");

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      await api.put(`/instances/${id}`, { status: "ACTIVE" });
      await refetch();
      toast.success("Instancia restaurada");
    } catch {
      toast.error("Error al restaurar instancia");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <div className="h-[68px] border-b border-horse-gray-200 flex items-center px-8 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Configuraci&oacute;n</h1>
      </div>
      <div className="p-8 max-w-2xl space-y-8">
        {/* Account settings placeholder */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-horse-black mb-2">Cuenta</h2>
          <p className="text-sm text-horse-gray-400">
            Configuraci&oacute;n de cuenta y equipo — pr&oacute;ximamente.
          </p>
        </div>

        {/* Archived instances */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-horse-black mb-4">Instancias archivadas</h2>
          {archivedInstances.length === 0 ? (
            <p className="text-sm text-horse-gray-400">No hay instancias archivadas.</p>
          ) : (
            <div className="space-y-3">
              {archivedInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between py-3 px-4 border border-horse-gray-200 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium text-horse-black">{instance.clientName}</span>
                    <span className="text-sm text-horse-gray-400 ml-2">{instance.company}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={restoring === instance.id}
                    onClick={() => handleRestore(instance.id)}
                  >
                    {restoring === instance.id ? "Restaurando..." : "Restaurar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
