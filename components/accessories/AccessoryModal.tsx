"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { accessorySchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { ACCESSORY_CATEGORIES } from "@/lib/constants";
import { useCreateAccessory, useUpdateAccessory } from "@/hooks/useAccessories";
import { ApiError } from "@/lib/fetcher";
import type { Accessory } from "@/lib/types";

interface AccessoryModalProps {
  open: boolean;
  onClose: () => void;
  accessory?: Accessory | null;
}

const empty = {
  name: "",
  sku: "",
  category: "Audio",
  qty: "0",
  costPrice: "",
  sellPrice: "",
  reorderLevel: "5",
  supplier: "",
};

export function AccessoryModal({ open, onClose, accessory }: AccessoryModalProps) {
  const toast = useToast();
  const create = useCreateAccessory();
  const update = useUpdateAccessory();
  const isEdit = Boolean(accessory);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      accessory
        ? {
            name: accessory.name,
            sku: accessory.sku,
            category: accessory.category,
            qty: String(accessory.qty),
            costPrice: String(accessory.costPrice),
            sellPrice: String(accessory.sellPrice),
            reorderLevel: String(accessory.reorderLevel),
            supplier: accessory.supplier ?? "",
          }
        : empty,
    );
  }, [open, accessory]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = accessorySchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    try {
      if (isEdit && accessory) {
        await update.mutateAsync({ id: accessory.id, values: parsed.data });
        toast.success("Accessory updated");
      } else {
        await create.mutateAsync(parsed.data);
        toast.success("Accessory added");
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
      title={isEdit ? "Edit accessory" : "Add accessory"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="acc-form" loading={busy}>
            {isEdit ? "Save changes" : "Add accessory"}
          </Button>
        </>
      }
    >
      <form id="acc-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" required value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="Android Stereo 9&quot;" className="sm:col-span-2" />
        <Input label="SKU" required value={values.sku} onChange={(e) => set("sku", e.target.value)} error={errors.sku} placeholder="AUD-STR-09" />
        <Select label="Category" value={values.category} onChange={(e) => set("category", e.target.value)} options={ACCESSORY_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Input label="Quantity" required type="number" value={values.qty} onChange={(e) => set("qty", e.target.value)} error={errors.qty} />
        <Input label="Reorder level" type="number" value={values.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} error={errors.reorderLevel} />
        <Input label="Cost price (Kč)" required type="number" value={values.costPrice} onChange={(e) => set("costPrice", e.target.value)} error={errors.costPrice} />
        <Input label="Sell price (Kč)" required type="number" value={values.sellPrice} onChange={(e) => set("sellPrice", e.target.value)} error={errors.sellPrice} />
        <Input label="Supplier" value={values.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Optional" className="sm:col-span-2" />
      </form>
    </Modal>
  );
}
