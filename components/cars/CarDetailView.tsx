"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCar } from "@/hooks/useCars";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, carStatusTone } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { CarModal } from "./CarModal";
import { formatMoney, formatNumber, formatDate } from "@/lib/utils";

// Lazy-load the 3D viewer so three.js never blocks the rest of the page.
const Car3DViewer = dynamic(() => import("./Car3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="glass grid h-72 w-full place-items-center rounded-2xl text-sm text-gray-400 sm:h-80">
      <span className="flex items-center gap-2">
        <Spinner /> Loading 3D view…
      </span>
    </div>
  ),
});

const STATUS_COLOR: Record<string, string> = {
  Available: "#2563eb",
  Reserved: "#d97706",
  Sold: "#6b7280",
};

export function CarDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: car, isLoading, isError } = useCar(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-gray-500">
        <Spinner /> Loading car…
      </div>
    );
  }
  if (isError || !car) {
    return (
      <div>
        <PageHeader title="Car not found" />
        <Link href="/cars" className="text-sm font-medium text-brand hover:underline">
          ← Back to cars
        </Link>
      </div>
    );
  }

  const spec: [string, string][] = [
    ["Year", String(car.year)],
    ["Type", car.type],
    ["Reg. number", car.regNo],
    ["Odometer", `${formatNumber(car.km)} mi`],
    ["Cost price", formatMoney(car.costPrice)],
    ["Asking price", formatMoney(car.askingPrice)],
    ["Margin", formatMoney(car.margin)],
    ["Days in stock", String(car.daysInStock)],
    ["Added", formatDate(car.addedDate)],
  ];

  return (
    <div>
      <div className="mb-4">
        <Link href="/cars" className="text-sm font-medium text-brand hover:underline">
          ← Back to cars
        </Link>
      </div>

      <PageHeader
        title={`${car.make} ${car.model}`}
        subtitle={`${car.year} · ${car.regNo}`}
        actions={
          <>
            <Badge tone={carStatusTone(car.status)}>{car.status}</Badge>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            {car.status !== "Sold" && (
              <Button
                onClick={() =>
                  router.push(`/invoices?new=1&carId=${car.id}`)
                }
              >
                Create sale
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3D viewer */}
        <Car3DViewer color={STATUS_COLOR[car.status] ?? "#2563eb"} />

        {/* Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <dl className="divide-y divide-line">
              {spec.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3">
                  <dt className="text-sm text-gray-500">{k}</dt>
                  <dd className="text-sm font-medium tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      {car.invoice && (
        <Card className="mt-6">
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              This car was sold on invoice{" "}
              <span className="font-medium text-ink">{car.invoice.invoiceNo}</span>.
            </p>
            <Link href={`/invoices/${car.invoice.id}`}>
              <Button size="sm" variant="secondary">
                View invoice
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <CarModal open={editOpen} onClose={() => setEditOpen(false)} car={car} />
    </div>
  );
}
