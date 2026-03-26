"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { ProcessingRun } from "@/lib/types";

interface UseProcessingStatusOptions {
  enabled?: boolean;
}

interface UseProcessingStatusResult {
  latestRun: ProcessingRun | null;
  loading: boolean;
}

export function useProcessingStatus(
  instanceId: string | undefined,
  options: UseProcessingStatusOptions = {}
): UseProcessingStatusResult {
  const { enabled = true } = options;
  const [latestRun, setLatestRun] = useState<ProcessingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLatestRun = useCallback(async () => {
    if (!instanceId) return;
    try {
      const runs = await api.get<ProcessingRun[]>(`/instances/${instanceId}/runs?limit=1`);
      setLatestRun(runs.length > 0 ? runs[0] : null);
    } catch {
      // Silently fail — don't break UI on polling errors
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId || !enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchLatestRun();

    const tick = () => {
      fetchLatestRun().then(() => {
        const isRunning = latestRun?.status === "RUNNING";

        if (isRunning) {
          idleTimeRef.current = 0;
        } else {
          idleTimeRef.current += isRunning ? 3000 : 10000;
        }

        // Stop polling after 60s of no RUNNING state
        if (idleTimeRef.current >= 60000 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const interval = latestRun?.status === "RUNNING" ? 3000 : 10000;
      intervalRef.current = setInterval(tick, interval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [instanceId, enabled, fetchLatestRun, latestRun?.status]);

  return { latestRun, loading };
}
