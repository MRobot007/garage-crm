"use client";

import Link from "next/link";
import { useCustomer } from "@/hooks/useCustomers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, invoiceStatusTone } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { formatMoney, formatDate } from "@/lib/utils";

export function CustomerDetailView({ id }: { id: string }) {
  const { data: c, isLoading, isError } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-gray-500">
        <Spinner /> Loading customer…
      </div>
    );
  }
  if (isError || !c) {
    return (
      <div>
        <PageHeader title="Customer not found" />
        <Link href="/customers" className="text-sm font-medium text-brand hover:underline">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const invoices = c.invoices ?? [];

  return (
    <div>
      <div className="mb-4">
        <Link href="/customers" className="text-sm font-medium text-brand hover:underline">
          ← Back to customers
        </Link>
      </div>

      <PageHeader title={c.name} subtitle={c.phone + (c.email ? ` · ${c.email}` : "")} />

      {/* Summary tiles */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-gray-500">Cars bought</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{c.carsPurchased}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-gray-500">Total spent</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{formatMoney(c.totalSpent)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-gray-500">Invoices</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{invoices.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              No invoices for this customer yet.
            </p>
          ) : (
            <TableWrap className="rounded-none border-0">
              <THead>
                <tr>
                  <TH>Invoice</TH>
                  <TH>Date</TH>
                  <TH>Vehicle</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-right">Balance</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <TBody>
                {invoices.map((inv) => (
                  <TR key={inv.id}>
                    <TD className="font-medium">
                      <Link href={`/invoices/${inv.id}`} className="text-ink hover:text-brand hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </TD>
                    <TD className="whitespace-nowrap text-gray-600">{formatDate(inv.date)}</TD>
                    <TD className="text-gray-600">
                      {inv.car ? `${inv.car.make} ${inv.car.model} ${inv.car.year}` : "—"}
                    </TD>
                    <TD className="text-right tabular-nums font-medium">{formatMoney(inv.total)}</TD>
                    <TD className={`text-right tabular-nums ${inv.balance > 0 ? "text-bad" : "text-ok"}`}>
                      {formatMoney(inv.balance)}
                    </TD>
                    <TD>
                      <Badge tone={invoiceStatusTone(inv.status)}>{inv.status}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
