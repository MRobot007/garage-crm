"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { SupplierModal } from "./SupplierModal";
import { OrderModal } from "./OrderModal";
import { useSuppliers, useDeleteSupplier } from "@/hooks/useSuppliers";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { formatDate } from "@/lib/utils";
import type { Supplier } from "@/lib/types";

export function SuppliersView() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const { data: suppliers, isLoading, isError } = useSuppliers(q);
  const del = useDeleteSupplier();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [orderFor, setOrderFor] = useState<Supplier | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", suppliers?.length ?? 0);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Supplier deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete supplier");
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Your suppliers — send purchase orders for accessories and cars by email."
        actions={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + Add supplier
          </Button>
        }
      />

      <div className="mb-4 w-full sm:w-72">
        <Input
          aria-label="Search suppliers"
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading suppliers…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load suppliers.</p>
      )}

      {suppliers && suppliers.length === 0 && (
        <EmptyState
          title="No suppliers yet"
          description="Add a supplier to start sending purchase orders by email."
          actionLabel="+ Add supplier"
          onAction={() => { setEditing(null); setModalOpen(true); }}
        />
      )}

      {suppliers && suppliers.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH className="text-right">Orders</TH>
              <TH>Last order</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {suppliers.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">
                  <Link href={`/suppliers/${s.id}`} className="text-ink hover:text-brand hover:underline">
                    {s.name}
                  </Link>
                </TD>
                <TD className="text-gray-600">
                  {s.email || <span className="text-warn">— add email</span>}
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{s.phone || "—"}</TD>
                <TD className="text-right tabular-nums">
                  {s.orderCount > 0 ? <Badge tone="neutral">{s.orderCount}</Badge> : "—"}
                </TD>
                <TD className="whitespace-nowrap text-gray-600">
                  {s.lastOrder ? formatDate(s.lastOrder) : "—"}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" onClick={() => setOrderFor(s)}>
                      Order
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setModalOpen(true); }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bad hover:bg-red-50"
                      onClick={() => setToDelete(s)}
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

      <SupplierModal open={modalOpen} onClose={() => setModalOpen(false)} supplier={editing} />
      <OrderModal open={Boolean(orderFor)} onClose={() => setOrderFor(null)} supplier={orderFor} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete supplier?"
        message={`Remove ${toDelete?.name} and all their orders? This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
