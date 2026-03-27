"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { useInstances } from "@/contexts/InstancesContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import StepPlatforms, { PlatformConfig } from "@/components/wizard/StepPlatforms";

interface SettingsForm {
  name: string;
  clientName: string;
  clientRole: string;
  company: string;
  industry: string;
  processingPeriod: "WEEKLY" | "MONTHLY";
  activeWindow: number;
}

function formFromInstance(instance: Instance): SettingsForm {
  return {
    name: instance.name,
    clientName: instance.clientName,
    clientRole: instance.clientRole,
    company: instance.company,
    industry: instance.industry,
    processingPeriod: instance.processingPeriod ?? "WEEKLY",
    activeWindow: instance.activeWindow ?? 8,
  };
}

export default function InstanceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { refetch } = useInstances();
  const toast = useToast();

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlatforms, setSavingPlatforms] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [form, setForm] = useState<SettingsForm>({
    name: "",
    clientName: "",
    clientRole: "",
    company: "",
    industry: "",
    processingPeriod: "WEEKLY",
    activeWindow: 8,
  });
  const [initialForm, setInitialForm] = useState<string>("");

  const defaultPlatforms: PlatformConfig[] = [
    { platform: "LINKEDIN", enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
    { platform: "X", enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
    { platform: "TIKTOK", enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
    { platform: "BLOG", enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
  ];
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(defaultPlatforms);
  const [initialPlatforms, setInitialPlatforms] = useState<string>(JSON.stringify(defaultPlatforms));

  useEffect(() => {
    api
      .get<Instance>(`/instances/${id}`)
      .then((data) => {
        setInstance(data);
        const f = formFromInstance(data);
        setForm(f);
        setInitialForm(JSON.stringify(f));
        if (data.platformConfigs && data.platformConfigs.length > 0) {
          const pConfigs: PlatformConfig[] = data.platformConfigs.map((pc) => ({
            platform: pc.platform,
            enabled: pc.enabled,
            postsPerPeriod: pc.postsPerPeriod,
            threadsPerPeriod: pc.threadsPerPeriod,
          }));
          setPlatforms(pConfigs);
          setInitialPlatforms(JSON.stringify(pConfigs));
        }
      })
      .catch(() => setInstance(null))
      .finally(() => setLoading(false));
  }, [id]);

  const isDirty = JSON.stringify(form) !== initialForm;
  const isPlatformsDirty = JSON.stringify(platforms) !== initialPlatforms;

  const update = (field: keyof SettingsForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.put<Instance>(`/instances/${id}`, form);
      const f = formFromInstance(data);
      setForm(f);
      setInitialForm(JSON.stringify(f));
      setInstance(data);
      toast.success("Cambios guardados correctamente");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await api.delete(`/instances/${id}`);
      await refetch();
      toast.success("Instancia archivada correctamente");
      router.push("/dashboard");
    } catch {
      toast.error("Error al archivar la instancia");
      setArchiving(false);
      setShowArchiveModal(false);
    }
  };

  const handleSavePlatforms = async () => {
    setSavingPlatforms(true);
    try {
      await api.put(`/instances/${id}/platforms`, platforms);
      setInitialPlatforms(JSON.stringify(platforms));
      toast.success("Plataformas actualizadas correctamente");
    } catch {
      toast.error("Error al guardar las plataformas");
    } finally {
      setSavingPlatforms(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!instance) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">Instancia no encontrada</span>
      </div>
    );
  }

  const fields = [
    { key: "name" as const, label: "Nombre de la instancia" },
    { key: "clientName" as const, label: "Nombre del cliente" },
    { key: "clientRole" as const, label: "Cargo / Rol" },
    { key: "company" as const, label: "Empresa" },
    { key: "industry" as const, label: "Industria" },
  ];

  return (
    <div className="max-w-lg space-y-6">
      {/* Section A + B: Editable form */}
      <form onSubmit={handleSave}>
        {/* Section A — Datos de la instancia */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-horse-black mb-4">
            Datos de la instancia
          </h2>
          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-horse-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section B — Configuracion de procesamiento */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-horse-black mb-4">
            Configuración de procesamiento
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">
                Período de procesamiento
              </label>
              <select
                value={form.processingPeriod}
                onChange={(e) => update("processingPeriod", e.target.value)}
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark bg-white"
              >
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">
                Ventana activa (períodos)
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={form.activeWindow}
                onChange={(e) => update("activeWindow", Number(e.target.value))}
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
              />
              <p className="text-xs text-horse-gray-400 mt-1">
                Cuántos períodos anteriores se usan como memoria activa para el procesamiento.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <Button type="submit" disabled={!isDirty || saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>

      {/* Section — Plataformas */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-horse-black mb-4">
          Plataformas
        </h2>
        <StepPlatforms platforms={platforms} onChange={setPlatforms} />
        <div className="mt-4">
          <Button
            onClick={handleSavePlatforms}
            disabled={!isPlatformsDirty || savingPlatforms}
          >
            {savingPlatforms ? "Guardando..." : "Guardar plataformas"}
          </Button>
        </div>
      </div>

      {/* Section C — Zona de peligro */}
      <div className="bg-white border border-red-300 rounded-xl p-6">
        <h2 className="text-base font-semibold text-red-600 mb-2">
          Zona de peligro
        </h2>
        <p className="text-sm text-horse-gray-500 mb-4">
          Archivar esta instancia la ocultará del sidebar. Podrás restaurarla desde Configuración.
        </p>
        <button
          type="button"
          onClick={() => setShowArchiveModal(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Archivar instancia
        </button>
      </div>

      {/* Archive confirmation modal */}
      <Modal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archivar instancia"
        size="sm"
      >
        <p className="text-sm text-horse-gray-600 mb-6">
          <span className="font-semibold text-horse-black">{instance.clientName}</span>{" "}
          dejará de aparecer en tu sidebar. Podrás restaurarla desde la página de Configuración.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowArchiveModal(false)}
            disabled={archiving}
          >
            Cancelar
          </Button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {archiving ? "Archivando..." : "Sí, archivar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
