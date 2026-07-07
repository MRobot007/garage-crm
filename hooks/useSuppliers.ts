"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Supplier } from "@/lib/types";
import type { SupplierValues } from "@/lib/schemas";
import { qk } from "./keys";

export function useSuppliers(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return useQuery({
    queryKey: [...qk.suppliers, q ?? ""],
    queryFn: () => getJSON<Supplier[]>(`/api/suppliers${query}`),
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: qk.supplier(id ?? ""),
    queryFn: () => getJSON<Supplier>(`/api/suppliers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SupplierValues) =>
      sendJSON<Supplier>("/api/suppliers", "POST", values),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.suppliers }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierValues }) =>
      sendJSON<Supplier>(`/api/suppliers/${id}`, "PATCH", values),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: qk.suppliers });
      qc.invalidateQueries({ queryKey: qk.supplier(id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJSON<{ id: string }>(`/api/suppliers/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.suppliers }),
  });
}
