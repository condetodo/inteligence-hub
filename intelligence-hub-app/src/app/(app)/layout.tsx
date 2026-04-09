"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { InstancesProvider } from "@/contexts/InstancesContext";
import { Spinner } from "@/components/ui/Spinner";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-horse-warm-bg flex items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <InstancesProvider>
        <div className="min-h-screen bg-horse-warm-bg">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Mobile header */}
          <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-horse-warm-border flex items-center px-4 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-horse-gray-500 hover:text-horse-black transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="ml-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-horse-gold rounded flex items-center justify-center text-horse-black text-xs font-bold">
                H
              </div>
              <span className="text-sm font-bold tracking-[1.5px] uppercase text-horse-black">
                Horse
              </span>
            </div>
          </div>

          <main className="pt-14 md:pt-0 md:ml-[260px]">{children}</main>
        </div>
      </InstancesProvider>
    </ToastProvider>
  );
}
