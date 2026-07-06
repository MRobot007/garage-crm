"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useCustomers } from "@/hooks/useCustomers";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { formatMoney, formatDate } from "@/lib/utils";

export function CustomersView() {
  const [q, setQ] = useState("");
  const { data: customers, isLoading, isError } = useCustomers(q);
  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", customers?.length ?? 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Everyone who’s enquired or purchased — built automatically from leads and invoices."
      />

      <div className="mb-4 w-full sm:w-72">
        <Input
          aria-label="Search customers"
          placeholder="Search name, phone, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading customers…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load customers.</p>
      )}

      {customers && customers.length === 0 && (
        <EmptyState
          title="No customers yet"
          description="Customers appear here as you add leads and create invoices."
        />
      )}

      {customers && customers.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Phone</TH>
              <TH>Email</TH>
              <TH className="text-right">Cars bought</TH>
              <TH className="text-right">Total spent</TH>
              <TH>Last purchase</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {customers.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">
                  <Link href={`/customers/${c.id}`} className="text-ink hover:text-brand hover:underline">
                    {c.name}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{c.phone}</TD>
                <TD className="text-gray-600">{c.email || "—"}</TD>
                <TD className="text-right tabular-nums">{c.carsPurchased}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMoney(c.totalSpent)}</TD>
                <TD className="whitespace-nowrap text-gray-600">
                  {c.lastPurchase ? formatDate(c.lastPurchase) : "—"}
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}
