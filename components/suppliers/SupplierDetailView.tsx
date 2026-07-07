"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupplier } from "@/hooks/useSuppliers";
import { useUpdateOrderStatus, useDeleteOrder } from "@/hooks/useOrders";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { SupplierModal } from "./SupplierModal";
import { OrderModal } from "./OrderModal";
import { formatDate } from "@/lib/utils";
import type { PurchaseOrder } from "@/lib/types";

function orderTone(status: string): "neutral" | "blue" | "green" {
  if (status === "Received") return "green";
  if (status === "Sent") return "blue";
  return "neutral";
}

function itemsSummary(o: PurchaseOrder): string {
  return o.items.map((i) => `${i.qty}× ${i.name}`).join(", ") || "—";
}

export function SupplierDetailView({ id }: { id: string }) {
  const toast = useToast();
  const { data: s, isLoading, isError } = useSupplier(id);
  const updateStatus = useUpdateOrderStatus();
  const delOrder = useDeleteOrder();

  const [editOpen, setEditOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PurchaseOrder | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-gray-500">
        <Spinner /> Loading supplier…
      </div>
    );
  }
  if (isError || !s) {
    return (
      <div>
        <PageHeader title="Supplier not found" />
        <Link href="/suppliers" className="text-sm font-medium text-brand hover:underline">
          ← Back to suppliers
        </Link>
      </div>
    );
  }

  const orders = s.orders ?? [];

  async function setStatus(order: PurchaseOrder, status: string) {
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success(`Marked ${order.orderNo} ${status}`);
    } catch {
      toast.error("Couldn’t update order");
    }
  }

  async function confirmDeleteOrder() {
    if (!toDelete) return;
    try {
      await delOrder.mutateAsync(toDelete.id);
      toast.success("Order deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete order");
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/suppliers" className="text-sm font-medium text-brand hover:underline">
          ← Back to suppliers
        </Link>
      </div>

      <PageHeader
        title={s.name}
        subtitle={[s.email, s.phone].filter(Boolean).join(" · ") || "No contact details"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button onClick={() => setOrderOpen(true)}>+ New order</Button>
          </>
        }
      />

      {s.notes && (
        <Card className="mb-6">
          <CardBody className="text-sm text-gray-600">{s.notes}</CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
          <Badge tone="neutral">{orders.length} orders</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-gray-500">No orders yet.</p>
              <div className="mt-3">
                <Button onClick={() => setOrderOpen(true)}>+ New order</Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/50">
              {orders.map((o) => (
                <li key={o.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{o.orderNo}</span>
                        <Badge tone={orderTone(o.status)}>{o.status}</Badge>
                        {o.emailedVia && (
                          <span className="text-xs text-gray-400">
                            via {o.emailedVia === "smtp" ? "email" : "Gmail"}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-600">{itemsSummary(o)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="mr-2 text-xs text-gray-400">{formatDate(o.date)}</span>
                      {o.status !== "Sent" && o.status !== "Received" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(o, "Sent")}>
                          Mark sent
                        </Button>
                      )}
                      {o.status === "Sent" && (
                        <Button size="sm" variant="secondary" onClick={() => setStatus(o, "Received")}>
                          Mark received
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-bad hover:bg-red-50"
                        onClick={() => setToDelete(o)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <SupplierModal open={editOpen} onClose={() => setEditOpen(false)} supplier={s} />
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} supplier={s} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete order?"
        message={`Delete ${toDelete?.orderNo}? This can’t be undone.`}
        confirmLabel="Delete"
        loading={delOrder.isPending}
        onConfirm={confirmDeleteOrder}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
