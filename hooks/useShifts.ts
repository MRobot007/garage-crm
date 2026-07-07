"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { ShiftEntry } from "@/lib/types";
import { qk } from "./keys";

export function useShifts() {
  return useQuery({
    queryKey: qk.shifts,
    queryFn: () => getJSON<ShiftEntry[]>("/api/shifts"),
  });
}

export function useStartShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendJSON<ShiftEntry>("/api/shifts", "POST"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts });
      qc.invalidateQueries({ queryKey: qk.audit });
    },
  });
}

export function useEndShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendJSON<{ id: string }>("/api/shifts/end", "POST"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts });
      qc.invalidateQueries({ queryKey: qk.audit });
    },
  });
}
