"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { ProcessingRun, Instance } from "@/lib/types";

type RunMap = Record<string, ProcessingRun | null>;

export function useDashboardPolling(instances: Instance[]) {
  const [latestRuns, setLatestRuns] = useState<RunMap>({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimeRef = useRef(0);

  const fetchAllRuns = useCallback(async () => {
    if (instances.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        instances.map((inst) =>
          api.get<ProcessingRun[]>(`/instances/${inst.id}/runs?limit=1`).then((runs) => ({
            id: inst.id,
            run: runs.length > 0 ? runs[0] : null,
          }))
        )
      );

      const map: RunMap = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.id] = result.value.run;
        }
      }
      setLatestRuns(map);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [instances]);

  useEffect(() => {
    if (instances.length === 0) {
      setLoading(false);
      return;
    }

    fetchAllRuns();

    const hasRunning = Object.values(latestRuns).some((r) => r?.status === "RUNNING");

    if (hasRunning) {
      idleTimeRef.current = 0;
    }

    const interval = hasRunning ? 5000 : 30000;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!hasRunning) {
        idleTimeRef.current += interval;
      }
      if (idleTimeRef.current >= 60000 && !hasRunning) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      fetchAllRuns();
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [instances, fetchAllRuns, latestRuns]);

  return { latestRuns, loading };
}
