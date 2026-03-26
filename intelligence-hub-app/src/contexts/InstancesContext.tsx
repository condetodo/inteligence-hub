"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";

interface InstancesContextType {
  instances: Instance[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const InstancesContext = createContext<InstancesContextType>({
  instances: [],
  loading: true,
  refetch: async () => {},
});

export function InstancesProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await api.get<Instance[]>("/instances");
      setInstances(data || []);
    } catch {
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return (
    <InstancesContext.Provider value={{ instances, loading, refetch: fetchInstances }}>
      {children}
    </InstancesContext.Provider>
  );
}

export function useInstances() {
  return useContext(InstancesContext);
}
