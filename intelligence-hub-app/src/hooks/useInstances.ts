"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";

export function useInstances() {
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

  return { instances, loading, refetch: fetchInstances };
}
