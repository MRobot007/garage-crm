"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { orderSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import {
  composeOrderBody,
  composeOrderSubject,
  buildGmailCompose,
} from "@/lib/order-compose";
import { useAccessories } from "@/hooks/useAccessories";
import { useSettings } from "@/hooks/useSettings";
import { useCreateOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { ApiError } from "@/lib/fetcher";
import type { Supplier } from "@/lib/types";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

interface Line {
  kind: "accessory" | "custom";
  accessoryId?: string;
  name: string;
  qty: number;
}

export function OrderModal({ open, onClose, supplier }: OrderModalProps) {
  const toast = useToast();
  const { data: accessories } = useAccessories();
  const { data: settings } = useSettings();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();

  const businessName = settings?.businessName ?? "Garage CRM";

  const [items, setItems] = useState<Line[]>([]);
  const [addKind, setAddKind] = useState<"accessory" | "custom">("accessory");
  const [addAccId, setAddAccId] = useState("");
  const [addCustom, setAddCustom] = useState("");
  const [addQty, setAddQty] = useState("1");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyEdited, setBodyEdited] = useState(false);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset on open.
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setAddKind("accessory");
    setAddAccId("");
    setAddCustom("");
    setAddQty("1");
    setSubject(composeOrderSubject(businessName));
    setBody("");
    setBodyEdited(false);
    setNotes("");
    setErrors({});
  }, [open, businessName]);

  // Auto-compose the email body from items until the user edits it manually.
  useEffect(() => {
    if (!open || bodyEdited) return;
    setBody(
      composeOrderBody({
        businessName,
        supplierName: supplier?.name ?? "",
        items,
      }),
    );
  }, [open, bodyEdited, items, businessName, supplier?.name]);

  function addItem() {
    if (addKind === "accessory") {
      const acc = accessories?.find((a) => a.id === addAccId);
      if (!acc) {
        toast.info("Pick an accessory first");
        return;
      }
      if (items.some((i) => i.accessoryId === acc.id)) {
        toast.info("That accessory is already on the order");
        return;
      }
      setItems((p) => [
        ...p,
        { kind: "accessory", accessoryId: acc.id, name: acc.name, qty: Math.max(1, Number(addQty) || 1) },
      ]);
      setAddAccId("");
      setAddQty("1");
    } else {
      const name = addCustom.trim();
      if (!name) {
        toast.info("Enter what you want to order (e.g. a car)");
        return;
      }
      setItems((p) => [
        ...p,
        { kind: "custom", name, qty: Math.max(1, Number(addQty) || 1) },
      ]);
      setAddCustom("");
      setAddQty("1");
    }
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  const accessoryOptions = accessories ?? [];
  const canSend = Boolean(supplier);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier) return;
    const payload = {
      supplierId: supplier.id,
      items: items.map((i) => ({
        kind: i.kind,
        accessoryId: i.accessoryId,
        name: i.name,
        qty: i.qty,
      })),
      subject,
      body,
      notes: notes || undefined,
      send: true,
    };
    const parsed = orderSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    setErrors({});

    // Pre-open a tab *synchronously* within the click so pop-up blockers allow
    // it; we point it at Gmail once the order is saved. Closed if not needed.
    const gmailTab = supplier.email ? window.open("", "_blank") : null;

    try {
      const res = await createOrder.mutateAsync(parsed.data);
      if (res.email.sent) {
        // Already sent server-side via SMTP — no Gmail needed.
        gmailTab?.close();
        toast.success(`Order ${res.order.orderNo} emailed to ${supplier.name}`);
      } else if (res.email.fallbackToMailto && supplier.email) {
        // Open Gmail compose pre-filled, then mark the order Sent.
        const url = buildGmailCompose(supplier.email, subject, body);
        if (gmailTab) gmailTab.location.href = url;
        else window.open(url, "_blank");
        updateStatus.mutate({ id: res.order.id, status: "Sent" });
        toast.success("Opening Gmail — just press Send there.");
      } else if (!res.email.supplierHasEmail) {
        gmailTab?.close();
        toast.error(
          "Saved as a draft — add an email to this supplier to send the order.",
        );
      } else {
        gmailTab?.close();
        toast.error(res.email.error || "Couldn't send — saved as a draft.");
      }
      onClose();
    } catch (err) {
      gmailTab?.close();
      toast.error(err instanceof ApiError ? err.message : "Couldn't create order");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? `Order from ${supplier.name}` : "New order"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={createOrder.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="order-form" loading={createOrder.isPending} disabled={!canSend}>
            {supplier?.email ? "Send order" : "Save order"}
          </Button>
        </>
      }
    >
      <form id="order-form" onSubmit={onSend} className="space-y-6">
        {/* Supplier line */}
        <div className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm">
          <span className="font-medium text-ink">{supplier?.name ?? "—"}</span>
          <span className="text-gray-500">
            {supplier?.email ? (
              supplier.email
            ) : (
              <span className="text-warn">No email on file — order will be saved as a draft</span>
            )}
          </span>
        </div>

        {/* Item builder */}
        <section>
          <Label>Items to order</Label>
          <div className="flex flex-wrap items-end gap-2">
            <Select
              aria-label="Item type"
              value={addKind}
              onChange={(e) => setAddKind(e.target.value as "accessory" | "custom")}
              className="w-36"
              options={[
                { value: "accessory", label: "Accessory" },
                { value: "custom", label: "Car / custom" },
              ]}
            />
            {addKind === "accessory" ? (
              <div className="min-w-[12rem] flex-1">
                <Select
                  aria-label="Accessory"
                  value={addAccId}
                  onChange={(e) => setAddAccId(e.target.value)}
                >
                  <option value="">Select accessory…</option>
                  {accessoryOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (stock {a.qty})
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="min-w-[12rem] flex-1">
                <Input
                  aria-label="Custom item"
                  value={addCustom}
                  onChange={(e) => setAddCustom(e.target.value)}
                  placeholder="e.g. Toyota Camry 2021, white"
                />
              </div>
            )}
            <Input
              aria-label="Quantity"
              type="number"
              min={1}
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              className="w-20"
            />
            <Button type="button" variant="secondary" onClick={addItem}>
              Add
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-slate-300/70 px-3 py-4 text-center text-sm text-gray-500">
              No items added yet.
            </p>
          ) : (
            <ul className="glass-soft mt-3 divide-y divide-white/50 rounded-lg">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="grid h-6 min-w-[2rem] place-items-center rounded bg-brand/10 px-2 text-xs font-semibold text-brand">
                    {it.qty}×
                  </span>
                  <span className="flex-1 truncate text-ink">{it.name}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-400">
                    {it.kind === "accessory" ? "Accessory" : "Custom"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    aria-label={`Remove ${it.name}`}
                    className="text-gray-400 hover:text-bad"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.items && <p className="mt-1 text-xs text-bad">{errors.items}</p>}
        </section>

        {/* Auto-composed email */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="mb-0">Email to supplier</Label>
            {bodyEdited && (
              <button
                type="button"
                onClick={() => setBodyEdited(false)}
                className="text-xs font-medium text-brand hover:underline"
              >
                ↺ Reset to auto-written
              </button>
            )}
          </div>
          <Input
            aria-label="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={errors.subject}
          />
          <Textarea
            aria-label="Email message"
            rows={9}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setBodyEdited(true);
            }}
            error={errors.body}
            className="font-mono text-[13px] leading-relaxed"
          />
          <p className="text-xs text-gray-400">
            This is written automatically from your items — edit anything before sending.
          </p>
        </section>
      </form>
    </Modal>
  );
}
