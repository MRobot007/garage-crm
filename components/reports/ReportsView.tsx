"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { formatMoney } from "@/lib/utils";

export function ReportsView() {
  const { data, isLoading, isError } = useReports();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-gray-500">
        <Spinner /> Loading reports…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Reports" />
        <p className="text-sm text-bad">Couldn’t load reports.</p>
      </div>
    );
  }

  const revTotal = data.revenueSplit.cars + data.revenueSplit.accessories;
  const staffMax = Math.max(1, ...data.salesByStaff.map((s) => s.revenue));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`Business snapshot · ${data.month}`}
        actions={
          <a
            href="/api/reports/export"
            download
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-brand to-teal-700 px-4 text-sm font-medium text-white shadow-md shadow-brand/25 transition-all hover:brightness-[1.08]"
            title="Download the business snapshot as CSV"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue split */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue: cars vs accessories</CardTitle>
            <span className="text-sm text-gray-500">{data.month}</span>
          </CardHeader>
          <CardBody className="space-y-4">
            {revTotal === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No sales this month yet.</p>
            ) : (
              <>
                <BarRow
                  label="Cars"
                  value={data.revenueSplit.cars}
                  total={revTotal}
                  color="bg-brand"
                />
                <BarRow
                  label="Accessories"
                  value={data.revenueSplit.accessories}
                  total={revTotal}
                  color="bg-ok"
                />
                <div className="border-t border-line pt-3 text-right text-sm">
                  <span className="text-gray-500">Total gross revenue: </span>
                  <span className="font-semibold tabular-nums text-ink">{formatMoney(revTotal)}</span>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Sales by staff */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by staff</CardTitle>
            <span className="text-sm text-gray-500">{data.month}</span>
          </CardHeader>
          <CardBody className="space-y-4">
            {data.salesByStaff.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No sales this month yet.</p>
            ) : (
              data.salesByStaff.map((s) => (
                <div key={s.staff}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{s.staff}</span>
                    <span className="tabular-nums text-gray-600">
                      {formatMoney(s.revenue)} · {s.count} sale{s.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.round((s.revenue / staffMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Leads by source */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Leads by source & conversion</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {data.leadsBySource.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">No leads recorded.</p>
          ) : (
            <TableWrap className="rounded-none border-0">
              <THead>
                <tr>
                  <TH>Source</TH>
                  <TH className="text-right">Leads</TH>
                  <TH className="text-right">Won</TH>
                  <TH className="text-right">Conversion</TH>
                  <TH className="w-40">Rate</TH>
                </tr>
              </THead>
              <TBody>
                {data.leadsBySource.map((s) => (
                  <TR key={s.source}>
                    <TD className="font-medium">{s.source}</TD>
                    <TD className="text-right tabular-nums">{s.total}</TD>
                    <TD className="text-right tabular-nums">{s.won}</TD>
                    <TD className="text-right tabular-nums font-medium">{s.conversion}%</TD>
                    <TD>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-ok"
                          style={{ width: `${s.conversion}%` }}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      {/* Dead stock */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dead stock — cars aging &gt; 60 days</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {data.deadStockCars.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">No aged cars. 🎉</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.deadStockCars.map((car) => (
                  <li key={car.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/cars/${car.id}`} className="truncate text-sm font-medium text-ink hover:text-brand hover:underline">
                        {car.make} {car.model} {car.year}
                      </Link>
                      <p className="text-xs text-gray-500">{formatMoney(car.askingPrice)}</p>
                    </div>
                    <Badge tone="red">{car.daysInStock} days</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessories never sold</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {data.slowAccessories.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">Everything has sold at least once.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.slowAccessories.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.sku}</p>
                    </div>
                    <Badge tone="amber">{a.qty} in stock</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-600">
          {formatMoney(value)} · {pct}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
