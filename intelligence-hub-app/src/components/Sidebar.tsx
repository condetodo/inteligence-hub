"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInstances } from "@/contexts/InstancesContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { instances } = useInstances();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "\u25EB" },
    { href: "/settings", label: "Configuración", icon: "\u2699" },
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  const sidebarContent = (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-horse-warm-sidebar border-r border-horse-warm-border flex flex-col z-40">
      <div className="px-6 py-5 pb-4 border-b border-horse-warm-border flex items-center gap-2.5">
        <div className="w-8 h-8 bg-horse-gold rounded-md flex items-center justify-center text-horse-black text-sm font-bold">
          H
        </div>
        <span className="text-[22px] font-bold tracking-[2px] uppercase text-horse-black">
          Horse
        </span>
      </div>

      <div className="px-6 pt-5 pb-2 text-[10px] uppercase text-horse-warm-subtle tracking-[1.5px] font-semibold">
        General
      </div>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors ${
              active
                ? "bg-horse-warm-surface text-horse-black font-medium border-l-[3px] border-horse-gold"
                : "text-horse-warm-text hover:bg-horse-warm-surface hover:text-horse-black"
            }`}
          >
            <span className="w-[18px] text-center text-[15px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="px-6 pt-5 pb-2 text-[10px] uppercase text-horse-warm-subtle tracking-[1.5px] font-semibold">
        Instancias
      </div>
      <div className="flex-1 overflow-y-auto">
        {instances.filter((i) => i.status !== "ARCHIVED").map((instance) => {
          const active = pathname.startsWith(`/instances/${instance.id}`);
          return (
            <Link
              key={instance.id}
              href={`/instances/${instance.id}/content`}
              onClick={handleNavClick}
              className={`flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-horse-warm-active text-horse-black border-l-[3px] border-horse-gold pl-[21px]"
                  : "text-horse-warm-text hover:bg-horse-warm-surface hover:text-horse-black"
              }`}
            >
              <div className="w-[34px] h-[34px] rounded-lg bg-horse-gray-100 flex items-center justify-center text-xs font-semibold text-horse-black flex-shrink-0">
                {getInitials(instance.clientName)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-horse-black text-[13px]">{instance.clientName}</span>
                <span className="text-[11px] text-horse-warm-muted mt-px">
                  {instance.clientRole} · {instance.company}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/instances/new"
        onClick={handleNavClick}
        className="mx-4 mb-4 py-2.5 border-[1.5px] border-dashed border-[#d4c8b0] rounded-lg text-center text-horse-warm-muted text-[13px] font-medium hover:border-horse-gold hover:text-horse-black transition-colors"
      >
        + Nueva instancia
      </Link>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />
          {sidebarContent}
        </div>
      )}
    </>
  );
}
