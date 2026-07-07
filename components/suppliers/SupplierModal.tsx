"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { supplierSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/useSuppliers";
import { ApiError } from "@/lib/fetcher";
import type { Supplier } from "@/lib/types";

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

const empty = { name: "", email: "", phone: "", notes: "" };

export function SupplierModal({ open, onClose, supplier }: SupplierModalProps) {
  const toast = useToast();
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const isEdit = Boolean(supplier);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      supplier
        ? {
            name: supplier.name,
            email: supplier.email ?? "",
            phone: supplier.phone ?? "",
            notes: supplier.notes ?? "",
          }
        : empty,
    );
  }, [open, supplier]);

  function set<K extends keyof typeof values>(key: K, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = supplierSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    try {
      if (isEdit && supplier) {
        await update.mutateAsync({ id: supplier.id, values: parsed.data });
        toast.success("Supplier updated");
      } else {
        await create.mutateAsync(parsed.data);
        toast.success("Supplier added");
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
      title={isEdit ? "Edit supplier" : "Add supplier"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="supplier-form" loading={busy}>
            {isEdit ? "Save changes" : "Add supplier"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Supplier name"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="e.g. WheelCraft Supplies"
          className="sm:col-span-2"
        />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          placeholder="orders@supplier.com"
          hint="Needed to send order emails."
        />
        <Input
          label="Phone"
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+1 (555) 000-0000"
        />
        <Textarea
          label="Notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="sm:col-span-2"
          placeholder="What they supply, terms, etc."
        />
      </form>
    </Modal>
  );
}
