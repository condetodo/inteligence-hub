"use client";

import Link from "next/link";
import { useInstances } from "@/hooks/useInstances";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { instances, loading } = useInstances();

  return (
    <div>
      <div className="h-auto min-h-[68px] border-b border-horse-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-8 py-3 sm:py-0 gap-2 sm:gap-0 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Dashboard</h1>
        <Link
          href="/instances/new"
          className="px-[18px] py-[9px] bg-horse-black text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors"
        >
          + Nueva instancia
        </Link>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <PageLoader message="Cargando instancias..." />
        ) : instances.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-horse-gray-400 text-sm mb-4">No hay instancias creadas todavía.</p>
            <Link
              href="/instances/new"
              className="inline-block px-6 py-3 bg-horse-black text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
            >
              Crear primera instancia
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => (
              <Link
                key={instance.id}
                href={`/instances/${instance.id}/content`}
                className="bg-white border border-horse-gray-200 rounded-xl p-5 hover:border-horse-gray-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-horse-gray-100 flex items-center justify-center text-sm font-semibold text-horse-black flex-shrink-0">
                    {getInitials(instance.clientName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-horse-black group-hover:underline">
                      {instance.clientName}
                    </h3>
                    <p className="text-xs text-horse-gray-400 mt-0.5">
                      {instance.role} · {instance.company}
                    </p>
                  </div>
                  <Badge variant={instance.status === "ACTIVE" ? "approved" : "default"} className="ml-auto">
                    {instance.status === "ACTIVE" ? "Activa" : instance.status === "PAUSED" ? "Pausada" : "Archivada"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-lg font-bold text-status-draft">
                      {instance.stats?.pendingInputs ?? 0}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Inputs pendientes</div>
                  </div>
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-lg font-bold text-horse-black">
                      {instance.stats?.contentCount ?? 0}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Contenidos</div>
                  </div>
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-[11px] font-medium text-horse-gray-500 mt-1">
                      {instance.stats?.lastProcessedAt
                        ? new Date(instance.stats.lastProcessedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : "—"}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Último proceso</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
