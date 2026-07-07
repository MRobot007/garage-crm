"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { OrderModal } from "@/components/suppliers/OrderModal";
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from "@/hooks/useOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { buildGmailCompose } from "@/lib/order-compose";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { PurchaseOrder, Supplier } from "@/lib/types";

function orderTone(status: string): "neutral" | "blue" | "green" {
  if (status === "Received") return "green";
  if (status === "Sent") return "blue";
  return "neutral";
}
function itemsSummary(o: PurchaseOrder): string {
  return o.items.map((i) => `${i.qty}× ${i.name}`).join(", ") || "—";
}

export function PurchaseOrdersView() {
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const filters = useMemo(() => ({ status, q }), [status, q]);
  const { data: orders, isLoading, isError } = useOrders(filters);
  const { data: suppliers } = useSuppliers();
  const updateStatus = useUpdateOrderStatus();
  const del = useDeleteOrder();

  const [toDelete, setToDelete] = useState<PurchaseOrder | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickId, setPickId] = useState("");
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", orders?.length ?? 0);

  async function setOrderStatus(o: PurchaseOrder, s: string) {
    try {
      await updateStatus.mutateAsync({ id: o.id, status: s });
      toast.success(`Marked ${o.orderNo} ${s}`);
    } catch {
      toast.error("Couldn’t update order");
    }
  }

  function reEmail(o: PurchaseOrder) {
    if (!o.emailTo || !o.subject || !o.body) {
      toast.info("This order has no saved email to resend.");
      return;
    }
    window.open(buildGmailCompose(o.emailTo, o.subject, o.body), "_blank");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Order deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete order");
      setToDelete(null);
    }
  }

  function startNewOrder() {
    const s = (suppliers ?? []).find((x) => x.id === pickId);
    if (!s) {
      toast.info("Pick a supplier first");
      return;
    }
    setOrderSupplier(s);
    setPickerOpen(false);
    setOrderOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Everything you've ordered from suppliers — accessories, tyres and stock."
        actions={
          <Button onClick={() => { setPickId(""); setPickerOpen(true); }}>
            + New order
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search orders"
            placeholder="Search order no or supplier…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-44"
          options={[
            { value: "all", label: "All statuses" },
            ...ORDER_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading orders…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load purchase orders.</p>
      )}

      {orders && orders.length === 0 && (
        <EmptyState
          title="No purchase orders yet"
          description="Send an order to a supplier and it will be recorded here."
          actionLabel="+ New order"
          onAction={() => { setPickId(""); setPickerOpen(true); }}
        />
      )}

      {orders && orders.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Date</TH>
              <TH>Supplier</TH>
              <TH>Items</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {orders.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">
                  {o.orderNo}
                  {o.emailedVia && (
                    <span className="ml-2 text-xs text-gray-400">
                      via {o.emailedVia === "smtp" ? "email" : "Gmail"}
                    </span>
                  )}
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{formatDate(o.date)}</TD>
                <TD>
                  {o.supplier ? (
                    <Link href={`/suppliers/${o.supplierId}`} className="text-ink hover:text-brand hover:underline">
                      {o.supplier.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD className="max-w-[20rem] truncate text-gray-600" title={itemsSummary(o)}>
                  {itemsSummary(o)}
                </TD>
                <TD>
                  <Badge tone={orderTone(o.status)}>{o.status}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    {o.emailTo && (
                      <Button size="sm" variant="ghost" onClick={() => reEmail(o)} title="Re-open in Gmail">
                        ↗ Email
                      </Button>
                    )}
                    {o.status === "Draft" && (
                      <Button size="sm" variant="ghost" onClick={() => setOrderStatus(o, "Sent")}>
                        Mark sent
                      </Button>
                    )}
                    {o.status === "Sent" && (
                      <Button size="sm" variant="secondary" onClick={() => setOrderStatus(o, "Received")}>
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
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      {/* Pick a supplier before composing a new order */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="New order — choose supplier"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button onClick={startNewOrder} disabled={!pickId}>Continue</Button>
          </>
        }
      >
        <Select
          aria-label="Supplier"
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
        >
          <option value="">Select a supplier…</option>
          {(suppliers ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.email ? ` · ${s.email}` : " · no email"}
            </option>
          ))}
        </Select>
        {(suppliers ?? []).length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No suppliers yet — add one on the{" "}
            <Link href="/suppliers" className="text-brand hover:underline">Suppliers</Link> page.
          </p>
        )}
      </Modal>

      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} supplier={orderSupplier} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete order?"
        message={`Delete ${toDelete?.orderNo}? This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
