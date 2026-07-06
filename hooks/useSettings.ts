"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Settings } from "@/lib/types";
import type { SettingsValues } from "@/lib/schemas";
import { qk } from "./keys";

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: () => getJSON<Settings>("/api/settings"),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SettingsValues) =>
      sendJSON<Settings>("/api/settings", "PATCH", values),
    onSuccess: (data) => {
      qc.setQueryData(qk.settings, data);
      qc.invalidateQueries({ queryKey: qk.settings });
    },
  });
}

/** Reset demo data by re-running the seed. */
export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendJSON<{ ok: boolean }>("/api/seed", "POST"),
    onSuccess: () => qc.invalidateQueries(),
  });
}
