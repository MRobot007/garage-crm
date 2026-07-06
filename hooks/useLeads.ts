"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Lead } from "@/lib/types";
import type { LeadValues } from "@/lib/schemas";
import { qk } from "./keys";

export interface LeadFilters {
  status?: string;
  source?: string;
  q?: string;
}

function buildQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.source && filters.source !== "all") params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: [...qk.leads, filters],
    queryFn: () => getJSON<Lead[]>(`/api/leads${buildQuery(filters)}`),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LeadValues) =>
      sendJSON<Lead>("/api/leads", "POST", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.leads });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
      qc.invalidateQueries({ queryKey: qk.customers });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: LeadValues }) =>
      sendJSON<Lead>(`/api/leads/${id}`, "PATCH", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.leads });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

/** Optimistic inline status change from the pipeline table. */
export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sendJSON<Lead>(`/api/leads/${id}`, "PATCH", { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: qk.leads });
      const snapshots = qc.getQueriesData<Lead[]>({ queryKey: qk.leads });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Lead[]>(
          key,
          data.map((l) => (l.id === id ? { ...l, status } : l)),
        );
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.leads });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendJSON<{ id: string }>(`/api/leads/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.leads });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}
