"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function NewInstancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    role: "",
    company: "",
    industry: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ instance: Instance }>("/instances", form);
      router.push(`/instances/${data.instance.id}/content`);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error al crear instancia";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name", label: "Nombre de la instancia", placeholder: "Ej: Martín LinkedIn Q1" },
    { key: "clientName", label: "Nombre del cliente", placeholder: "Ej: Martín Rodríguez" },
    { key: "role", label: "Cargo / Rol", placeholder: "Ej: CEO" },
    { key: "company", label: "Empresa", placeholder: "Ej: AutomatizaPYME" },
    { key: "industry", label: "Industria", placeholder: "Ej: Tecnología / Automatización" },
  ];

  return (
    <div>
      <div className="h-[68px] border-b border-horse-gray-200 flex items-center px-8 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Nueva instancia</h1>
      </div>

      <div className="p-8 max-w-lg">
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-horse-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear instancia"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
