"use client";

import { useState, useRef, useEffect } from "react";
import { Instance } from "@/lib/types";
import { useAuth } from "@/lib/auth";

interface InstanceTopbarProps {
  instance: Instance;
}

export function InstanceTopbar({ instance }: InstanceTopbarProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="h-auto min-h-[68px] border-b border-horse-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 md:px-8 py-3 sm:py-0 gap-2 sm:gap-0 bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-horse-black">{instance.clientName}</h1>
        <span className="text-[13px] text-horse-gray-400">
          {instance.company}
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-horse-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-horse-purple flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium text-horse-black hidden sm:block">
            {user?.name ?? "Usuario"}
          </span>
          <svg
            className={`w-4 h-4 text-horse-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-horse-gray-200 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-2 text-sm text-horse-gray-500 hover:bg-horse-gray-50 transition-colors"
            >
              Editar perfil
            </button>
            <div className="border-t border-horse-gray-200 my-1" />
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
