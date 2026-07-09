"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { carSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { CAR_STATUSES, CAR_TYPES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { useCreateCar, useUpdateCar } from "@/hooks/useCars";
import { ApiError } from "@/lib/fetcher";
import type { Car } from "@/lib/types";

interface CarModalProps {
  open: boolean;
  onClose: () => void;
  car?: Car | null;
}

const empty = {
  make: "",
  model: "",
  year: String(new Date().getFullYear()),
  type: "Used",
  category: "Car",
  regNo: "",
  km: "0",
  costPrice: "",
  askingPrice: "",
  status: "Available",
};

export function CarModal({ open, onClose, car }: CarModalProps) {
  const toast = useToast();
  const create = useCreateCar();
  const update = useUpdateCar();
  const isEdit = Boolean(car);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      car
        ? {
            make: car.make,
            model: car.model,
            year: String(car.year),
            type: car.type,
            category: car.category ?? "Car",
            regNo: car.regNo,
            km: String(car.km),
            costPrice: String(car.costPrice),
            askingPrice: String(car.askingPrice),
            status: car.status,
          }
        : empty,
    );
  }, [open, car]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = carSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    try {
      if (isEdit && car) {
        await update.mutateAsync({ id: car.id, values: parsed.data });
        toast.success("Vehicle updated");
      } else {
        await create.mutateAsync(parsed.data);
        toast.success("Vehicle added");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit vehicle" : "Add vehicle"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="car-form" loading={busy}>
            {isEdit ? "Save changes" : "Add vehicle"}
          </Button>
        </>
      }
    >
      <form id="car-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Make" required value={values.make} onChange={(e) => set("make", e.target.value)} error={errors.make} placeholder="Škoda / Yamaha" />
        <Input label="Model" required value={values.model} onChange={(e) => set("model", e.target.value)} error={errors.model} placeholder="Octavia / MT-07" />
        <Input label="Year" required type="number" value={values.year} onChange={(e) => set("year", e.target.value)} error={errors.year} />
        <Select label="Vehicle" value={values.category} onChange={(e) => set("category", e.target.value)} options={VEHICLE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Select label="Condition" value={values.type} onChange={(e) => set("type", e.target.value)} options={CAR_TYPES.map((t) => ({ value: t, label: t }))} />
        <Input label="Reg. number" required value={values.regNo} onChange={(e) => set("regNo", e.target.value)} error={errors.regNo} placeholder="1AB 2345" />
        <Input label="Odometer (km)" type="number" value={values.km} onChange={(e) => set("km", e.target.value)} error={errors.km} />
        <Input label="Cost price (Kč)" required type="number" value={values.costPrice} onChange={(e) => set("costPrice", e.target.value)} error={errors.costPrice} placeholder="280000" />
        <Input label="Asking price (Kč)" required type="number" value={values.askingPrice} onChange={(e) => set("askingPrice", e.target.value)} error={errors.askingPrice} placeholder="320000" />
        <Select label="Status" value={values.status} onChange={(e) => set("status", e.target.value)} options={CAR_STATUSES.map((s) => ({ value: s, label: s }))} className="sm:col-span-2" />
      </form>
    </Modal>
  );
}
