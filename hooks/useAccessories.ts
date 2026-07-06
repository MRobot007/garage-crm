"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Accessory } from "@/lib/types";
import type { AccessoryValues } from "@/lib/schemas";
import { qk } from "./keys";

export interface AccessoryFilters {
  category?: string;
  q?: string;
  lowOnly?: boolean;
}

function buildQuery(f: AccessoryFilters): string {
  const p = new URLSearchParams();
  if (f.category && f.category !== "all") p.set("category", f.category);
  if (f.q) p.set("q", f.q);
  if (f.lowOnly) p.set("low", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useAccessories(filters: AccessoryFilters = {}) {
  return useQuery({
    queryKey: [...qk.accessories, filters],
    queryFn: () => getJSON<Accessory[]>(`/api/accessories${buildQuery(filters)}`),
  });
}

export function useCreateAccessory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AccessoryValues) =>
      sendJSON<Accessory>("/api/accessories", "POST", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useUpdateAccessory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AccessoryValues }) =>
      sendJSON<Accessory>(`/api/accessories/${id}`, "PATCH", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

/** Optimistic +/- stock adjustment. */
export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      sendJSON<Accessory>(`/api/accessories/${id}/adjust`, "POST", { delta }),
    onMutate: async ({ id, delta }) => {
      await qc.cancelQueries({ queryKey: qk.accessories });
      const snapshots = qc.getQueriesData<Accessory[]>({ queryKey: qk.accessories });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Accessory[]>(
          key,
          data.map((a) =>
            a.id === id
              ? {
                  ...a,
                  qty: Math.max(0, a.qty + delta),
                  lowStock: Math.max(0, a.qty + delta) <= a.reorderLevel,
                }
              : a,
          ),
        );
      });
      return { snapshots };
    },
    onError: (_e, _v, ctx) =>
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useDeleteAccessory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJSON<{ id: string }>(`/api/accessories/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
