"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge, invoiceStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { InvoiceModal } from "./InvoiceModal";
import {
  useInvoices,
  useRecordPayment,
  useDeleteInvoice,
} from "@/hooks/useInvoices";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { INVOICE_STATUSES } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

export function InvoicesView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [status, setStatus] = useState("all");
  const { data: invoices, isLoading, isError } = useInvoices(status);
  const recordPayment = useRecordPayment();
  const del = useDeleteInvoice();

  const [createOpen, setCreateOpen] = useState(false);
  const [prefill, setPrefill] = useState<
    { name?: string; phone?: string; carId?: string } | undefined
  >(undefined);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [toDelete, setToDelete] = useState<Invoice | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", invoices?.length ?? 0);

  // Open the builder prefilled when arriving via ?new=1 (from a lead or car).
  useEffect(() => {
    if (params.get("new") === "1") {
      setPrefill({
        name: params.get("name") ?? undefined,
        phone: params.get("phone") ?? undefined,
        carId: params.get("carId") ?? undefined,
      });
      setCreateOpen(true);
      router.replace("/invoices");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openNew() {
    setPrefill(undefined);
    setCreateOpen(true);
  }

  async function submitPayment() {
    if (!payFor) return;
    const amount = Number(payAmount) || 0;
    try {
      await recordPayment.mutateAsync({ id: payFor.id, received: amount });
      toast.success("Payment recorded");
      setPayFor(null);
    } catch {
      toast.error("Couldn’t record payment");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Invoice deleted (stock & car restored)");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete invoice");
      setToDelete(null);
    }
  }

  function summary(inv: Invoice): string {
    const parts: string[] = [];
    if (inv.car) parts.push(`${inv.car.make} ${inv.car.model}`);
    const accCount = inv.items.filter((i) => i.kind === "accessory").length;
    if (accCount) parts.push(`${accCount} accessor${accCount === 1 ? "y" : "ies"}`);
    return parts.join(" · ") || "—";
  }

  return (
    <div>
      <PageHeader
        title="Sales & Invoices"
        subtitle="Create invoices, track payments and balances."
        actions={<Button onClick={openNew}>+ New invoice</Button>}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-44"
          options={[
            { value: "all", label: "All statuses" },
            ...INVOICE_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading invoices…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load invoices.</p>
      )}

      {invoices && invoices.length === 0 && (
        <EmptyState
          title="No invoices yet"
          description="Create your first sale — pick a customer, a car and/or accessories."
          actionLabel="+ New invoice"
          onAction={openNew}
        />
      )}

      {invoices && invoices.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Invoice</TH>
              <TH>Date</TH>
              <TH>Customer</TH>
              <TH>Items</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">Balance</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {invoices.map((inv) => (
              <TR key={inv.id}>
                <TD className="font-medium">
                  <Link href={`/invoices/${inv.id}`} className="text-ink hover:text-brand hover:underline">
                    {inv.invoiceNo}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{formatDate(inv.date)}</TD>
                <TD>{inv.customer?.name ?? "—"}</TD>
                <TD className="text-gray-600">{summary(inv)}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMoney(inv.total)}</TD>
                <TD className={`text-right tabular-nums ${inv.balance > 0 ? "text-bad" : "text-ok"}`}>
                  {formatMoney(inv.balance)}
                </TD>
                <TD>
                  <Badge tone={invoiceStatusTone(inv.status)}>{inv.status}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    {inv.balance > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setPayFor(inv);
                          setPayAmount(String(inv.received));
                        }}
                      >
                        Payment
                      </Button>
                    )}
                    <Link href={`/invoices/${inv.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bad hover:bg-red-50"
                      onClick={() => setToDelete(inv)}
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

      <InvoiceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefill={prefill}
        onCreated={(id) => router.push(`/invoices/${id}`)}
      />

      {/* Record payment */}
      <Modal
        open={Boolean(payFor)}
        onClose={() => setPayFor(null)}
        title={`Record payment · ${payFor?.invoiceNo ?? ""}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayFor(null)}>
              Cancel
            </Button>
            <Button loading={recordPayment.isPending} onClick={submitPayment}>
              Save payment
            </Button>
          </>
        }
      >
        {payFor && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Invoice total</span>
              <span className="font-medium tabular-nums">{formatMoney(payFor.total)}</span>
            </div>
            <Input
              label="Total amount received (₹)"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              hint="Enter the cumulative amount received so far."
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete invoice?"
        message={`Delete ${toDelete?.invoiceNo}? The car will be marked Available and accessory stock will be restored.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
