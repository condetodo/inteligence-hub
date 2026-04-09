"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Instance, Platform } from "@/lib/types";
import { useInstances } from "@/contexts/InstancesContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import StepPlatforms, { PlatformConfig } from "@/components/wizard/StepPlatforms";
import AgentPersonalityPanel, {
  defaultConfig,
  defaultSliders,
} from "@/components/settings/AgentPersonalityPanel";
import type {
  AgentConfig,
  StyleSliders,
} from "@/components/settings/AgentPersonalityPanel";

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

type SettingsTab = "general" | "plataformas" | "personalidad" | "peligro";

const tabs: readonly { key: SettingsTab; label: string; danger?: boolean }[] = [
  { key: "general", label: "General" },
  { key: "plataformas", label: "Plataformas" },
  { key: "personalidad", label: "Personalidad" },
  { key: "peligro", label: "Zona de peligro", danger: true },
];

const platformLabels: Record<Platform, string> = {
  LINKEDIN: "LinkedIn",
  X: "X",
  TIKTOK: "TikTok",
  BLOG: "Blog",
};

export default function InstanceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { refetch } = useInstances();
  const toast = useToast();

  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "general";
  const [activeTab, setActiveTabState] = useState<SettingsTab>(
    tabs.some((t) => t.key === initialTab) ? initialTab : "general"
  );

  const setActiveTab = (tab: SettingsTab) => {
    setActiveTabState(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [agentPlatformTab, setAgentPlatformTab] = useState<Platform>("LINKEDIN");

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
  const [initialPlatforms, setInitialPlatforms] = useState<string>(
    JSON.stringify(defaultPlatforms)
  );

  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>({});
  const [initialAgentConfigs, setInitialAgentConfigs] = useState<string>("{}");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.get<Instance>(`/instances/${id}`);
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

        // Load agent configs for all platforms
        try {
          const configsRes = await api.get<
            Array<{ platform: string } & AgentConfig>
          >(`/instances/${id}/agent-config`);
          const configMap: Record<string, AgentConfig> = {};
          for (const c of configsRes) {
            configMap[c.platform] = {
              styleSliders: {
                ...defaultSliders,
                ...(c.styleSliders as StyleSliders),
              },
              styleInstructions: c.styleInstructions ?? "",
              referenceExamples: c.referenceExamples ?? "",
              restrictions: Array.isArray(c.restrictions) ? c.restrictions : [],
            };
          }
          setAgentConfigs(configMap);
          setInitialAgentConfigs(JSON.stringify(configMap));
        } catch {
          // Agent configs may not exist yet — that's fine
        }
      } catch {
        setInstance(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Filter personality sub-tabs to enabled platforms
  const enabledPlatforms = platforms
    .filter((p) => p.enabled)
    .map((p) => p.platform as Platform);

  useEffect(() => {
    if (!enabledPlatforms.includes(agentPlatformTab) && enabledPlatforms.length > 0) {
      setAgentPlatformTab(enabledPlatforms[0]);
    }
  }, [platforms]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInstanceDirty = JSON.stringify(form) !== initialForm;
  const isPlatformsDirty = JSON.stringify(platforms) !== initialPlatforms;
  const isAgentConfigsDirty = JSON.stringify(agentConfigs) !== initialAgentConfigs;
  const isDirty = isInstanceDirty || isPlatformsDirty || isAgentConfigsDirty;

  const update = (field: keyof SettingsForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const promises: Promise<unknown>[] = [];
      if (isInstanceDirty) {
        promises.push(
          api.put<Instance>(`/instances/${id}`, form).then((data) => {
            const f = formFromInstance(data);
            setForm(f);
            setInitialForm(JSON.stringify(f));
            setInstance(data);
          })
        );
      }
      if (isPlatformsDirty) {
        promises.push(
          api.put(`/instances/${id}/platforms`, platforms).then(() => {
            setInitialPlatforms(JSON.stringify(platforms));
          })
        );
      }
      if (isAgentConfigsDirty) {
        const initial = JSON.parse(initialAgentConfigs) as Record<string, AgentConfig>;
        for (const [platform, config] of Object.entries(agentConfigs)) {
          if (JSON.stringify(config) !== JSON.stringify(initial[platform])) {
            promises.push(
              api.put(`/instances/${id}/agent-config/${platform}`, config).then(() => {
                setInitialAgentConfigs((prev) => {
                  const parsed = JSON.parse(prev);
                  parsed[platform] = config;
                  return JSON.stringify(parsed);
                });
              })
            );
          }
        }
      }
      await Promise.all(promises);
      toast.success("Cambios guardados correctamente");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSavingAll(false);
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/instances/${id}/permanent`);
      await refetch();
      toast.success("Instancia eliminada permanentemente");
      router.push("/dashboard");
    } catch {
      toast.error("Error al eliminar la instancia");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!instance) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">
          Instancia no encontrada
        </span>
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
    <div className="max-w-[650px]">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-horse-gray-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? tab.danger
                    ? "border-red-500 text-red-600"
                    : "border-horse-black text-horse-black"
                  : "border-transparent text-horse-gray-400 hover:text-horse-gray-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* General tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Datos de la instancia */}
          <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
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

          {/* Configuracion de procesamiento */}
          <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
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
                  Cuántos períodos anteriores se usan como memoria activa para el
                  procesamiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plataformas tab */}
      {activeTab === "plataformas" && (
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-horse-black mb-4">
            Plataformas
          </h2>
          <StepPlatforms platforms={platforms} onChange={setPlatforms} />
        </div>
      )}

      {/* Personalidad tab */}
      {activeTab === "personalidad" && (
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-horse-black mb-4">
            Personalidad del Agente
          </h2>
          <p className="text-xs text-horse-gray-400 mb-4">
            Configura el tono y estilo de generacion de contenido para cada
            plataforma.
          </p>

          {enabledPlatforms.length === 0 ? (
            <p className="text-sm text-horse-gray-400">
              Habilitá al menos una plataforma para configurar la personalidad.
            </p>
          ) : (
            <>
              {/* Platform sub-tabs */}
              <div className="flex gap-1 mb-5 border-b border-horse-gray-200">
                {enabledPlatforms.map((p) => {
                  const isActive = agentPlatformTab === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAgentPlatformTab(p)}
                      className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        isActive
                          ? "border-horse-black text-horse-black"
                          : "border-transparent text-horse-gray-400 hover:text-horse-gray-600"
                      }`}
                    >
                      {platformLabels[p]}
                    </button>
                  );
                })}
              </div>

              <AgentPersonalityPanel
                key={agentPlatformTab}
                config={agentConfigs[agentPlatformTab] || defaultConfig}
                onChange={(c) =>
                  setAgentConfigs((prev) => ({
                    ...prev,
                    [agentPlatformTab]: c,
                  }))
                }
              />
            </>
          )}
        </div>
      )}

      {/* Peligro tab */}
      {activeTab === "peligro" && (
        <div className="bg-white border border-red-300 rounded-xl p-6">
          <h2 className="text-base font-semibold text-red-600 mb-2">
            Zona de peligro
          </h2>

          {instance.status !== "ARCHIVED" && (
            <div className="mb-5">
              <p className="text-sm text-horse-gray-500 mb-3">
                Archivar esta instancia la ocultará del sidebar. Podrás
                restaurarla desde Configuración.
              </p>
              <button
                type="button"
                onClick={() => setShowArchiveModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Archivar instancia
              </button>
            </div>
          )}

          <div
            className={
              instance.status !== "ARCHIVED"
                ? "pt-5 border-t border-red-200"
                : ""
            }
          >
            <p className="text-sm text-horse-gray-500 mb-3">
              Eliminar permanentemente esta instancia y todo su contenido,
              inputs, insights y brand voice.{" "}
              <span className="font-semibold text-red-600">
                Esta acción no se puede deshacer.
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmName("");
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar permanentemente
            </button>
          </div>
        </div>
      )}

      {/* Save button — shown on all tabs except peligro */}
      {activeTab !== "peligro" && (
        <div className="mt-8">
          <Button onClick={handleSaveAll} disabled={!isDirty || savingAll}>
            {savingAll ? "Guardando..." : "Guardar todos los cambios"}
          </Button>
        </div>
      )}

      {/* Archive confirmation modal */}
      <Modal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archivar instancia"
        size="sm"
      >
        <p className="text-sm text-horse-gray-600 mb-6">
          <span className="font-semibold text-horse-black">
            {instance.clientName}
          </span>{" "}
          dejará de aparecer en tu sidebar. Podrás restaurarla desde la página
          de Configuración.
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

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar instancia permanentemente"
        size="sm"
      >
        <p className="text-sm text-horse-gray-600 mb-4">
          Se eliminará{" "}
          <span className="font-semibold text-horse-black">
            {instance.clientName}
          </span>{" "}
          junto con todo su contenido, inputs, insights y brand voice. Esta
          acción no se puede deshacer.
        </p>
        <p className="text-sm text-horse-gray-600 mb-2">
          Escribí{" "}
          <span className="font-mono font-semibold text-red-600">
            {instance.clientName}
          </span>{" "}
          para confirmar:
        </p>
        <input
          type="text"
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          placeholder={instance.clientName}
          className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-400 mb-6"
        />
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting || deleteConfirmName !== instance.clientName}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? "Eliminando..." : "Eliminar permanentemente"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
