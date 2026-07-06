"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { Invoice } from "@/lib/types";
import type { InvoiceValues } from "@/lib/schemas";
import { qk } from "./keys";

export function useInvoices(status?: string) {
  const query = status && status !== "all" ? `?status=${status}` : "";
  return useQuery({
    queryKey: [...qk.invoices, status ?? "all"],
    queryFn: () => getJSON<Invoice[]>(`/api/invoices${query}`),
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: qk.invoice(id ?? ""),
    queryFn: () => getJSON<Invoice>(`/api/invoices/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: InvoiceValues) =>
      sendJSON<Invoice>("/api/invoices", "POST", values),
    onSuccess: () => {
      // A new invoice touches nearly every aggregate.
      qc.invalidateQueries({ queryKey: qk.invoices });
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.customers });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

/** Record an additional payment against an invoice. */
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, received }: { id: string; received: number }) =>
      sendJSON<Invoice>(`/api/invoices/${id}`, "PATCH", { received }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: qk.invoices });
      qc.invalidateQueries({ queryKey: qk.invoice(id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJSON<{ id: string }>(`/api/invoices/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.invoices });
      qc.invalidateQueries({ queryKey: qk.cars });
      qc.invalidateQueries({ queryKey: qk.accessories });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.reports });
    },
  });
}
