"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge, carStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { CarModal } from "./CarModal";
import {
  useCars,
  useUpdateCarStatus,
  useDeleteCar,
} from "@/hooks/useCars";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { useMe } from "@/hooks/useMe";
import { useDebounce } from "@/hooks/useDebounce";
import { CAR_STATUSES, CAR_TYPES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { formatMoney, formatNumber } from "@/lib/utils";
import { ApiError } from "@/lib/fetcher";
import type { Car } from "@/lib/types";

export function CarsView() {
  const toast = useToast();
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 250);

  const filters = useMemo(
    () => ({ status, type, category, q: dq }),
    [status, type, category, dq],
  );
  const { data: cars, isLoading, isError } = useCars(filters);
  const updateStatus = useUpdateCarStatus();
  const del = useDeleteCar();
  const { data: me } = useMe();
  const canDelete = me?.role !== "staff";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Car | null>(null);
  const [toDelete, setToDelete] = useState<Car | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", cars?.length ?? 0);

  async function onStatusChange(car: Car, next: string) {
    try {
      await updateStatus.mutateAsync({ id: car.id, status: next });
    } catch {
      toast.error("Couldn’t update status");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Vehicle deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn’t delete vehicle");
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Cars and bikes in stock — margin and days-in-stock at a glance."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Add vehicle
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search vehicles"
            placeholder="Search make, model, reg no…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by vehicle"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-36"
          options={[
            { value: "all", label: "All vehicles" },
            ...VEHICLE_CATEGORIES.map((c) => ({ value: c, label: `${c}s` })),
          ]}
        />
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-40"
          options={[
            { value: "all", label: "All statuses" },
            ...CAR_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          aria-label="Filter by condition"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-36"
          options={[
            { value: "all", label: "All conditions" },
            ...CAR_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading vehicles…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load vehicles.</p>
      )}

      {cars && cars.length === 0 && (
        <EmptyState
          title="No vehicles in inventory"
          description="Add a car or bike to start tracking stock, margin and sales."
          actionLabel="+ Add vehicle"
          onAction={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      )}

      {/* Mobile: stacked cards (desktop table below is unchanged) */}
      {cars && cars.length > 0 && (
        <ul className="space-y-3 sm:hidden">
          {cars.map((car) => (
            <li key={car.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/cars/${car.id}`}
                    className="font-medium text-ink hover:text-brand hover:underline"
                  >
                    {car.make} {car.model} {car.year}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {car.regNo} · {formatNumber(car.km)} km · {car.daysInStock}d
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={car.category === "Bike" ? "amber" : "neutral"}>{car.category}</Badge>
                  <Badge tone={car.type === "New" ? "blue" : "neutral"}>{car.type}</Badge>
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatMoney(car.askingPrice)}
                </span>
                <span
                  className={`text-sm tabular-nums ${car.margin >= 0 ? "text-ok" : "text-bad"}`}
                >
                  {formatMoney(car.margin)} margin
                </span>
              </div>
              <div className="mt-3">
                <Select
                  aria-label={`Status for ${car.make} ${car.model}`}
                  value={car.status}
                  onChange={(e) => onStatusChange(car, e.target.value)}
                  className="h-9 w-full text-sm"
                  disabled={Boolean(car.invoice)}
                  options={CAR_STATUSES.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/cars/${car.id}`}>
                  <Button size="sm" variant="ghost">View</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(car); setModalOpen(true); }}>
                  Edit
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-bad hover:bg-red-50"
                    onClick={() => setToDelete(car)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {cars && cars.length > 0 && (
        <TableWrap className="hidden sm:block">
          <THead>
            <tr>
              <TH>Vehicle</TH>
              <TH>Kind</TH>
              <TH>Condition</TH>
              <TH>Reg no</TH>
              <TH className="text-right">Km</TH>
              <TH className="text-right">Asking</TH>
              <TH className="text-right">Margin</TH>
              <TH className="text-right">Days</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {cars.map((car) => (
              <TR key={car.id}>
                <TD>
                  <Link
                    href={`/cars/${car.id}`}
                    className="font-medium text-ink hover:text-brand hover:underline"
                  >
                    {car.make} {car.model}
                  </Link>
                  <div className="text-xs text-gray-500">{car.year}</div>
                </TD>
                <TD>
                  <Badge tone={car.category === "Bike" ? "amber" : "neutral"}>{car.category}</Badge>
                </TD>
                <TD>
                  <Badge tone={car.type === "New" ? "blue" : "neutral"}>{car.type}</Badge>
                </TD>
                <TD className="whitespace-nowrap text-gray-600">{car.regNo}</TD>
                <TD className="text-right tabular-nums text-gray-600">{formatNumber(car.km)}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMoney(car.askingPrice)}</TD>
                <TD
                  className={`text-right tabular-nums ${car.margin >= 0 ? "text-ok" : "text-bad"}`}
                >
                  {formatMoney(car.margin)}
                </TD>
                <TD className="text-right tabular-nums text-gray-600">{car.daysInStock}</TD>
                <TD>
                  <Select
                    aria-label={`Status for ${car.make} ${car.model}`}
                    value={car.status}
                    onChange={(e) => onStatusChange(car, e.target.value)}
                    className="h-8 w-32 text-[13px]"
                    disabled={Boolean(car.invoice)}
                    options={CAR_STATUSES.map((s) => ({ value: s, label: s }))}
                  />
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/cars/${car.id}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(car); setModalOpen(true); }}>
                      Edit
                    </Button>
                    {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bad hover:bg-red-50"
                      onClick={() => setToDelete(car)}
                    >
                      Delete
                    </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <CarModal open={modalOpen} onClose={() => setModalOpen(false)} car={editing} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete vehicle?"
        message={`Remove ${toDelete?.make} ${toDelete?.model} (${toDelete?.regNo})? This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
