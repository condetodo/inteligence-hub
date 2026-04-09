"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface InstanceTabsProps {
  instanceId: string;
  counts?: {
    content?: number;
    inputs?: number;
  };
}

export function InstanceTabs({ instanceId, counts }: InstanceTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: `/instances/${instanceId}/content`, label: "Contenido", count: counts?.content },
    { href: `/instances/${instanceId}/inputs`, label: "Inputs", count: counts?.inputs },
    { href: `/instances/${instanceId}/insights`, label: "Insights" },
    { href: `/instances/${instanceId}/brand-voice`, label: "Brand Voice" },
    { href: `/instances/${instanceId}/history`, label: "Historial" },
    { href: `/instances/${instanceId}/costs`, label: "Costos" },
    { href: `/instances/${instanceId}/settings`, label: "Ajustes" },
  ];

  return (
    <div className="flex gap-0 border-b border-horse-warm-border px-4 md:px-8 bg-white overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "text-horse-black border-horse-gold"
                : "text-horse-warm-muted border-transparent hover:text-horse-black"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-[7px] py-[2px] rounded-[10px] text-[11px] font-semibold ${
                  active ? "bg-horse-gold text-horse-black" : "bg-horse-warm-active text-horse-warm-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
