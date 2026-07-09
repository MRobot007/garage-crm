"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useInvoice } from "@/hooks/useInvoices";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/Button";
import { Badge, invoiceStatusTone } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, formatDate } from "@/lib/utils";

export function InvoiceDetailView({ id }: { id: string }) {
  const { data: inv, isLoading, isError } = useInvoice(id);
  const { data: settings } = useSettings();

  // Auto-open the print dialog when arriving straight after creating the sale.
  const printed = useRef(false);
  useEffect(() => {
    if (!inv || printed.current) return;
    if (new URLSearchParams(window.location.search).get("print") === "1") {
      printed.current = true;
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
  }, [inv]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-gray-500">
        <Spinner /> Loading invoice…
      </div>
    );
  }
  if (isError || !inv) {
    return (
      <div>
        <PageHeader title="Invoice not found" />
        <Link href="/invoices" className="text-sm font-medium text-brand hover:underline">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar (hidden on print) */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/invoices" className="text-sm font-medium text-brand hover:underline">
          ← Back to invoices
        </Link>
        <div className="flex items-center gap-2">
          <Badge tone={invoiceStatusTone(inv.status)}>{inv.status}</Badge>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area mx-auto max-w-3xl rounded-md border border-line bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-ink">
                {settings?.businessName ?? "VOZIDEX"}
              </h1>
              <p className="mt-1 text-sm text-gray-500">United States</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-ink">INVOICE</p>
            <p className="text-sm text-gray-600">{inv.invoiceNo}</p>
            <p className="text-sm text-gray-500">{formatDate(inv.date)}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Bill to</p>
            <p className="mt-1 font-medium text-ink">{inv.customer?.name ?? "—"}</p>
            <p className="text-sm text-gray-600">{inv.customer?.phone ?? ""}</p>
          </div>
          <div className="text-right">
            {inv.staff && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Handled by</p>
                <p className="mt-1 text-sm text-gray-600">{inv.staff}</p>
              </>
            )}
          </div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-center font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Unit price</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {inv.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5">
                  {it.name}
                  {it.kind === "car" && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red-800">
                      Car
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-center tabular-nums">{it.qty}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(it.price)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatMoney(inv.subtotal)} />
            {inv.discount > 0 && <Row label="Discount" value={`− ${formatMoney(inv.discount)}`} />}
            <Row label={`Sales Tax (${inv.gstPercent}%)`} value={formatMoney(inv.gst)} />
            <div className="my-1.5 border-t border-line" />
            <Row label="Total" value={formatMoney(inv.total)} bold />
            <Row label="Received" value={formatMoney(inv.received)} />
            <Row label="Balance due" value={formatMoney(inv.balance)} bold />
          </dl>
        </div>

        {inv.notes && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</p>
            <p className="mt-1 text-sm text-gray-600">{inv.notes}</p>
          </div>
        )}

        <p className="mt-8 border-t border-line pt-4 text-center text-xs text-gray-400">
          Thank you for your business.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-semibold text-ink" : "text-gray-600"}>{label}</dt>
      <dd className={`tabular-nums ${bold ? "font-semibold text-ink" : "text-gray-700"}`}>{value}</dd>
    </div>
  );
}
