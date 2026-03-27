'use client';

interface ProfileData {
  name: string;
  clientName: string;
  clientRole: string;
  company: string;
  industry: string;
}

interface Props {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
}

const fields = [
  { key: 'name' as const, label: 'Nombre de la instancia', placeholder: 'Ej: Martin LinkedIn Q1' },
  { key: 'clientName' as const, label: 'Nombre del cliente', placeholder: 'Ej: Martin Rodriguez' },
  { key: 'clientRole' as const, label: 'Cargo / Rol', placeholder: 'Ej: CEO' },
  { key: 'company' as const, label: 'Empresa', placeholder: 'Ej: AutomatizaPYME' },
  { key: 'industry' as const, label: 'Industria', placeholder: 'Ej: Tecnologia / Automatizacion' },
];

export default function StepProfile({ data, onChange }: Props) {
  const update = (key: keyof ProfileData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 max-w-lg">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-horse-gray-700 mb-1">{f.label}</label>
          <input
            value={data[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black transition-colors"
          />
        </div>
      ))}
    </div>
  );
}
