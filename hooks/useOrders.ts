"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getJSON, sendJSON } from "@/lib/fetcher";
import type { PurchaseOrder } from "@/lib/types";
import type { OrderValues } from "@/lib/schemas";
import { qk } from "./keys";

export interface OrderFilters {
  status?: string;
  q?: string;
}

export function useOrders(filters: OrderFilters = {}) {
  const p = new URLSearchParams();
  if (filters.status && filters.status !== "all") p.set("status", filters.status);
  if (filters.q) p.set("q", filters.q);
  const qs = p.toString();
  return useQuery({
    queryKey: [...qk.orders, filters],
    queryFn: () => getJSON<PurchaseOrder[]>(`/api/orders${qs ? `?${qs}` : ""}`),
  });
}

export interface CreateOrderResult {
  order: PurchaseOrder;
  email: {
    sent: boolean;
    fallbackToMailto: boolean;
    supplierHasEmail: boolean;
    smtpConfigured: boolean;
    error?: string;
  };
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: OrderValues) =>
      sendJSON<CreateOrderResult>("/api/orders", "POST", values),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.suppliers });
      qc.invalidateQueries({ queryKey: qk.supplier(res.order.supplierId) });
      qc.invalidateQueries({ queryKey: qk.orders });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sendJSON<PurchaseOrder>(`/api/orders/${id}`, "PATCH", { status }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: qk.suppliers });
      qc.invalidateQueries({ queryKey: qk.supplier(order.supplierId) });
      qc.invalidateQueries({ queryKey: qk.orders });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sendJSON<{ id: string }>(`/api/orders/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.suppliers });
      qc.invalidateQueries({ queryKey: qk.orders });
    },
  });
}
