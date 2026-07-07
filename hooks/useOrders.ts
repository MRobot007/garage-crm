"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendJSON } from "@/lib/fetcher";
import type { PurchaseOrder } from "@/lib/types";
import type { OrderValues } from "@/lib/schemas";
import { qk } from "./keys";

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
