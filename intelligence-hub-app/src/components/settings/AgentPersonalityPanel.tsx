"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";

interface StyleSliders {
  formal: number;
  technical: number;
  concise: number;
}

interface AgentConfig {
  styleSliders: StyleSliders;
  styleInstructions: string;
  referenceExamples: string;
  restrictions: string[];
}

const defaultSliders: StyleSliders = {
  formal: 0.5,
  technical: 0.5,
  concise: 0.5,
};

const defaultConfig: AgentConfig = {
  styleSliders: defaultSliders,
  styleInstructions: "",
  referenceExamples: "",
  restrictions: [],
};

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}

function PersonalitySlider({ value, onChange, leftLabel, rightLabel }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-horse-gray-500">
        <span>{leftLabel}</span>
        <span className="font-mono text-[11px] text-horse-gray-400">
          {value.toFixed(2)}
        </span>
        <span>{rightLabel}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-horse-gray-200 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-horse-black [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-horse-black [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-white"
      />
    </div>
  );
}

interface Props {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

export { defaultConfig, defaultSliders };
export type { AgentConfig, StyleSliders };

export default function AgentPersonalityPanel({ config, onChange }: Props) {
  const [restrictionInput, setRestrictionInput] = useState("");

  const update = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const addRestriction = () => {
    const text = restrictionInput.trim();
    if (!text) return;
    if (config.restrictions.includes(text)) {
      setRestrictionInput("");
      return;
    }
    update("restrictions", [...config.restrictions, text]);
    setRestrictionInput("");
  };

  const removeRestriction = (index: number) => {
    update(
      "restrictions",
      config.restrictions.filter((_, i) => i !== index)
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRestriction();
    }
  };

  return (
    <div className="space-y-5">
      {/* Sliders */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-horse-gray-700">Tono y estilo</h3>
        <PersonalitySlider
          value={config.styleSliders.formal}
          onChange={(v) => update("styleSliders", { ...config.styleSliders, formal: v })}
          leftLabel="Formal"
          rightLabel="Conversacional"
        />
        <PersonalitySlider
          value={config.styleSliders.technical}
          onChange={(v) => update("styleSliders", { ...config.styleSliders, technical: v })}
          leftLabel="Tecnico"
          rightLabel="Accesible"
        />
        <PersonalitySlider
          value={config.styleSliders.concise}
          onChange={(v) => update("styleSliders", { ...config.styleSliders, concise: v })}
          leftLabel="Conciso"
          rightLabel="Detallado"
        />
      </div>

      {/* Style instructions */}
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-1">
          Instrucciones de estilo
        </label>
        <textarea
          value={config.styleInstructions}
          onChange={(e) => update("styleInstructions", e.target.value)}
          placeholder="Ej: Usa metaforas deportivas, Cerra con una pregunta..."
          rows={3}
          className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark resize-y"
        />
      </div>

      {/* Reference examples */}
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-1">
          Ejemplos de referencia
        </label>
        <textarea
          value={config.referenceExamples}
          onChange={(e) => update("referenceExamples", e.target.value)}
          placeholder="Pega posts que te gusten como referencia de tono y formato..."
          rows={4}
          className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark resize-y"
        />
      </div>

      {/* Restrictions */}
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-1">
          Restricciones
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={restrictionInput}
            onChange={(e) => setRestrictionInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: No mencionar competidores"
            className="flex-1 px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRestriction}
            disabled={!restrictionInput.trim()}
          >
            Agregar
          </Button>
        </div>
        {config.restrictions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {config.restrictions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-horse-gray-100 text-horse-gray-700 text-xs rounded-full"
              >
                {r}
                <button
                  type="button"
                  onClick={() => removeRestriction(i)}
                  className="text-horse-gray-400 hover:text-horse-black transition-colors leading-none"
                  aria-label={`Eliminar restriccion: ${r}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
