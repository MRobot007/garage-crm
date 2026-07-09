"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Car } from "@/lib/types";
import type { CarValues } from "@/lib/schemas";
import { qk } from "./keys";

export interface CarFilters {
  status?: string;
  type?: string;
  category?: string;
  q?: string;
}

function buildQuery(f: CarFilters): string {
  const p = new URLSearchParams();
  if (f.status && f.status !== "all") p.set("status", f.status);
  if (f.type && f.type !== "all") p.set("type", f.type);
  if (f.category && f.category !== "all") p.set("category", f.category);
  if (f.q) p.set("q", f.q);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useCars(filters: CarFilters = {}) {
  return useQuery({
    queryKey: [...qk.cars, filters],
    queryFn: () => getJSON<Car[]>(`/api/cars${buildQuery(filters)}`),
  });
}

export function useCar(id: string | undefined) {
  return useQuery({
    queryKey: qk.car(id ?? ""),
    queryFn: () => getJSON<Car>(`/api/cars/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CarValues) => sendJSON<Car>("/api/cars", "POST", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

export function useUpdateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CarValues }) =>
      sendJSON<Car>(`/api/cars/${id}`, "PATCH", values),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.car(id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

/** Optimistic status change (Available / Reserved / Sold). */
export function useUpdateCarStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sendJSON<Car>(`/api/cars/${id}`, "PATCH", { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: qk.cars });
      const snapshots = qc.getQueriesData<Car[]>({ queryKey: qk.cars });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Car[]>(
          key,
          data.map((c) => (c.id === id ? { ...c, status } : c)),
        );
      });
      return { snapshots };
    },
    onError: (_e, _v, ctx) =>
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendJSON<{ id: string }>(`/api/cars/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}
