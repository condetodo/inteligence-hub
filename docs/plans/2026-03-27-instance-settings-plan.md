# Instance Settings Tab + Archive — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Ajustes" tab to each instance where users can edit instance details, configure processing settings, and archive/restore instances.

**Architecture:** New Settings tab page under the instance route, confirmation modal for archive, archived instances section in the global Configuracion page. Backend already supports all operations (PUT update, DELETE archive). Sidebar filters out archived instances.

**Tech Stack:** Next.js 14, React, Tailwind CSS, existing api client + toast + modal components.

---

### Task 1: Filter archived instances from sidebar

**Files:**
- Modify: `intelligence-hub-app/src/components/Sidebar.tsx:71`

**Step 1: Add filter to sidebar instance list**

In `Sidebar.tsx`, change line 71 from:

```tsx
{instances.map((instance) => {
```

to:

```tsx
{instances.filter((i) => i.status !== "ARCHIVED").map((instance) => {
```

**Step 2: Verify no build errors**

Run: `cd intelligence-hub-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or at minimum no errors in Sidebar.tsx)

**Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/Sidebar.tsx
git commit -m "feat: filter archived instances from sidebar"
```

---

### Task 2: Add "Ajustes" tab to instance tab navigation

**Files:**
- Modify: `intelligence-hub-app/src/components/InstanceTabs.tsx:22`

**Step 1: Add the settings tab**

In `InstanceTabs.tsx`, add a new entry to the `tabs` array after the Historial tab (after line 22):

```tsx
const tabs = [
    { href: `/instances/${instanceId}/content`, label: "Contenido", count: counts?.content },
    { href: `/instances/${instanceId}/inputs`, label: "Inputs", count: counts?.inputs },
    { href: `/instances/${instanceId}/insights`, label: "Insights" },
    { href: `/instances/${instanceId}/brand-voice`, label: "Brand Voice" },
    { href: `/instances/${instanceId}/history`, label: "Historial" },
    { href: `/instances/${instanceId}/settings`, label: "Ajustes" },
];
```

**Step 2: Commit**

```bash
git add intelligence-hub-app/src/components/InstanceTabs.tsx
git commit -m "feat: add Ajustes tab to instance navigation"
```

---

### Task 3: Create the Settings page

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/settings/page.tsx`

**Step 1: Create the settings page**

Create the file with a form that edits instance details + processing config + archive button. The page reads the instance from the layout context (refetch from API using params.id).

```tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { useInstances } from "@/contexts/InstancesContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";

export default function InstanceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { refetch } = useInstances();
  const toast = useToast();

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    clientName: "",
    clientRole: "",
    company: "",
    industry: "",
    processingPeriod: "WEEKLY" as "WEEKLY" | "MONTHLY",
    activeWindow: 8,
  });

  const [original, setOriginal] = useState(form);

  useEffect(() => {
    api
      .get<Instance>(`/instances/${id}`)
      .then((data) => {
        const values = {
          name: data.name,
          clientName: data.clientName,
          clientRole: data.clientRole,
          company: data.company,
          industry: data.industry,
          processingPeriod: data.processingPeriod || "WEEKLY",
          activeWindow: data.activeWindow ?? 8,
        };
        setForm(values);
        setOriginal(values);
        setInstance(data);
      })
      .catch(() => setInstance(null))
      .finally(() => setLoading(false));
  }, [id]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/instances/${id}`, form);
      setOriginal(form);
      await refetch();
      toast.success("Cambios guardados");
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await api.delete(`/instances/${id}`);
      await refetch();
      toast.success("Instancia archivada");
      router.push("/dashboard");
    } catch {
      toast.error("Error al archivar instancia");
    } finally {
      setArchiving(false);
      setArchiveModal(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!instance) return <div className="p-8 text-horse-gray-400 text-sm">Instancia no encontrada</div>;

  const infoFields = [
    { key: "name", label: "Nombre de la instancia", placeholder: "Ej: Martín LinkedIn Q1" },
    { key: "clientName", label: "Nombre del cliente", placeholder: "Ej: Martín Rodríguez" },
    { key: "clientRole", label: "Cargo / Rol", placeholder: "Ej: CEO" },
    { key: "company", label: "Empresa", placeholder: "Ej: AutomatizaPYME" },
    { key: "industry", label: "Industria", placeholder: "Ej: Tecnología / Automatización" },
  ];

  return (
    <div className="max-w-lg space-y-6">
      {/* Section A: Instance Info */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-horse-black mb-4">Datos de la instancia</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {infoFields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">{f.label}</label>
              <input
                type="text"
                value={form[f.key as keyof typeof form] as string}
                onChange={(e) => update(f.key, e.target.value)}
                required
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder={f.placeholder}
              />
            </div>
          ))}

          {/* Section B: Processing Config */}
          <div className="border-t border-horse-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-horse-black mb-3">Configuracion de procesamiento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-horse-gray-700 mb-1">Periodo</label>
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
                <label className="block text-sm font-medium text-horse-gray-700 mb-1">Ventana activa (periodos)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={form.activeWindow}
                  onChange={(e) => update("activeWindow", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                />
                <p className="text-xs text-horse-gray-400 mt-1">
                  Cuantos periodos anteriores se usan como memoria activa para el procesamiento.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={!isDirty || saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>

      {/* Section C: Danger Zone */}
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-red-600 mb-2">Zona de peligro</h2>
        <p className="text-sm text-horse-gray-500 mb-4">
          Archivar esta instancia la ocultara del sidebar. Podras restaurarla desde Configuracion.
        </p>
        <button
          onClick={() => setArchiveModal(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Archivar instancia
        </button>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal open={archiveModal} onClose={() => setArchiveModal(false)} title="Archivar instancia" size="sm">
        <p className="text-sm text-horse-gray-600 mb-6">
          <strong>{instance.clientName}</strong> dejara de aparecer en tu sidebar.
          Podras restaurarla desde la pagina de Configuracion.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setArchiveModal(false)}>
            Cancelar
          </Button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {archiving ? "Archivando..." : "Si, archivar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd intelligence-hub-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add intelligence-hub-app/src/app/\(app\)/instances/\[id\]/settings/page.tsx
git commit -m "feat: add instance settings page with edit form and archive"
```

---

### Task 4: Add archived instances section to Configuracion page

**Files:**
- Modify: `intelligence-hub-app/src/app/(app)/settings/page.tsx`

**Step 1: Rewrite the settings page to include archived instances**

Replace the entire content of `settings/page.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
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
        <h1 className="text-lg font-semibold text-horse-black">Configuracion</h1>
      </div>
      <div className="p-8 max-w-2xl space-y-8">
        {/* Account settings placeholder */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-horse-black mb-2">Cuenta</h2>
          <p className="text-sm text-horse-gray-400">
            Configuracion de cuenta y equipo — proximamente.
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
```

**Step 2: Verify build**

Run: `cd intelligence-hub-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add intelligence-hub-app/src/app/\(app\)/settings/page.tsx
git commit -m "feat: add archived instances section to Configuracion page"
```

---

### Task 5: Verify backend supports status update via PUT

**Step 1: Check that the backend PUT /instances/:id accepts status field**

Read: `intelligence-hub-api/src/controllers/instances.controller.ts` — look at the update method and Zod schema for the update endpoint.

If the update Zod schema does not include `status`, add it:

```ts
status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
```

**Step 2: If changes needed, commit**

```bash
git add intelligence-hub-api/src/controllers/instances.controller.ts
git commit -m "fix: allow status update via PUT /instances/:id"
```

---

### Task 6: Smoke test the full flow

**Step 1: Start the dev server**

Run: `cd intelligence-hub-app && npm run dev`

**Step 2: Verify the flow**

1. Navigate to an instance → verify "Ajustes" tab appears
2. Click Ajustes → verify form loads with instance data
3. Edit a field → verify "Guardar cambios" button enables
4. Save → verify toast appears and data persists on reload
5. Click "Archivar instancia" → verify modal appears
6. Confirm archive → verify redirect to dashboard, instance gone from sidebar
7. Go to Configuracion → verify archived instance appears
8. Click "Restaurar" → verify instance returns to sidebar

**Step 3: Final commit if any fixes needed**

```bash
git commit -m "fix: smoke test fixes for instance settings"
```
