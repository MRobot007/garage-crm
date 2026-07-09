"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { invoiceSchema } from "@/lib/schemas";
import { flattenZod } from "@/lib/api";
import { computeTotals } from "@/lib/calc";
import { formatMoney } from "@/lib/utils";
import { useCustomers } from "@/hooks/useCustomers";
import { useCars } from "@/hooks/useCars";
import { useAccessories } from "@/hooks/useAccessories";
import { useSettings } from "@/hooks/useSettings";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { ApiError } from "@/lib/fetcher";

interface Prefill {
  name?: string;
  phone?: string;
  carId?: string;
  email?: string;
  accessory?: string; // the accessory the lead asked about — auto-added as a line
}
interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: Prefill;
  onCreated?: (invoiceId: string) => void;
}

interface LineItem {
  accessoryId: string;
  name: string;
  qty: number;
  price: number;
}

export function InvoiceModal({ open, onClose, prefill, onCreated }: InvoiceModalProps) {
  const toast = useToast();
  const { data: customers } = useCustomers();
  const { data: cars } = useCars({});
  const { data: accessories } = useAccessories();
  const { data: settings } = useSettings();
  const create = useCreateInvoice();

  const [customerMode, setCustomerMode] = useState<"existing" | "new">("new");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [carId, setCarId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [gstPercent, setGstPercent] = useState("8");
  const [received, setReceived] = useState("0");
  const [addAccId, setAddAccId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cars available to sell (unsold, not already invoiced) + any prefilled car.
  const availableCars = useMemo(
    () =>
      (cars ?? []).filter(
        (c) => (!c.invoice && c.status !== "Sold") || c.id === prefill?.carId,
      ),
    [cars, prefill?.carId],
  );
  const selectedCar = availableCars.find((c) => c.id === carId);

  const appliedAcc = useRef(false);

  // Reset when (re)opened.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setCustomerMode(prefill?.name ? "new" : "existing");
    setCustomerId("");
    setCustomerName(prefill?.name ?? "");
    setCustomerPhone(prefill?.phone ?? "");
    setCustomerEmail(prefill?.email ?? "");
    setCarId(prefill?.carId ?? "");
    setItems([]);
    setDiscount("0");
    setGstPercent(String(settings?.gstPercent ?? 8));
    setReceived("0");
    setAddAccId("");
    appliedAcc.current = false;
  }, [open, prefill, settings?.gstPercent]);

  // Auto-add the accessory the lead was interested in (once accessories load).
  useEffect(() => {
    if (!open || appliedAcc.current) return;
    const want = prefill?.accessory?.trim();
    if (!want || !accessories) return;
    appliedAcc.current = true;
    const acc =
      accessories.find((a) => a.name.toLowerCase() === want.toLowerCase()) ||
      accessories.find((a) => want.toLowerCase().includes(a.name.toLowerCase()));
    if (acc) {
      setItems((prev) =>
        prev.some((i) => i.accessoryId === acc.id)
          ? prev
          : [...prev, { accessoryId: acc.id, name: acc.name, qty: 1, price: acc.sellPrice }],
      );
    }
  }, [open, prefill?.accessory, accessories]);

  function addAccessoryLine(id: string) {
    if (!id) return;
    const acc = accessories?.find((a) => a.id === id);
    if (!acc) return;
    if (items.some((i) => i.accessoryId === id)) {
      toast.info("That accessory is already on the invoice");
      return;
    }
    setItems((prev) => [
      ...prev,
      { accessoryId: acc.id, name: acc.name, qty: 1, price: acc.sellPrice },
    ]);
    setAddAccId("");
  }

  function updateLine(id: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((i) => (i.accessoryId === id ? { ...i, ...patch } : i)),
    );
  }
  function removeLine(id: string) {
    setItems((prev) => prev.filter((i) => i.accessoryId !== id));
  }

  const totals = useMemo(
    () =>
      computeTotals({
        items: items.map((i) => ({ qty: i.qty, price: i.price })),
        carPrice: selectedCar?.askingPrice ?? 0,
        discount: Number(discount) || 0,
        gstPercent: Number(gstPercent) || 0,
        received: Number(received) || 0,
      }),
    [items, selectedCar, discount, gstPercent, received],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      customerId: customerMode === "existing" ? customerId : undefined,
      customerName: customerMode === "new" ? customerName : undefined,
      customerPhone: customerMode === "new" ? customerPhone : undefined,
      customerEmail: customerMode === "new" ? customerEmail : undefined,
      carId: carId || undefined,
      items: items.map((i) => ({
        accessoryId: i.accessoryId,
        name: i.name,
        qty: i.qty,
        price: i.price,
      })),
      discount: Number(discount) || 0,
      gstPercent: Number(gstPercent) || 0,
      received: Number(received) || 0,
    };
    const parsed = invoiceSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(flattenZod(parsed.error));
      return;
    }
    try {
      const invoice = await create.mutateAsync(parsed.data);
      toast.success(`Invoice ${invoice.invoiceNo} created`);
      onCreated?.(invoice.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn’t create invoice");
    }
  }

  const accessoryOptions = (accessories ?? []).filter((a) => a.qty > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="invoice-form" loading={create.isPending}>
            Create invoice
          </Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={onSubmit} className="space-y-6">
        {/* Customer */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Customer</h3>
            <div className="glass-soft flex rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCustomerMode("existing")}
                className={`rounded px-2.5 py-1 ${customerMode === "existing" ? "bg-brand text-white" : "text-gray-600"}`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("new")}
                className={`rounded px-2.5 py-1 ${customerMode === "new" ? "bg-brand text-white" : "text-gray-600"}`}
              >
                New
              </button>
            </div>
          </div>

          {customerMode === "existing" ? (
            <Select
              aria-label="Select customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              error={errors.customerName}
            >
              <option value="">Select a customer…</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.phone}
                </option>
              ))}
            </Select>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Name" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} error={errors.customerName} placeholder="Customer name" />
              <Input label="Phone" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+420 …" />
              <Input label="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Optional" />
            </div>
          )}
        </section>

        {/* Car */}
        <section>
          <Label>Car (optional)</Label>
          <Select
            aria-label="Select car"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
          >
            <option value="">No car on this invoice</option>
            {availableCars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.make} {c.model} {c.year} · {c.regNo} · {formatMoney(c.askingPrice)}
              </option>
            ))}
          </Select>
        </section>

        {/* Accessories */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">Accessories</h3>
            <div className="w-64">
              <Select
                aria-label="Add accessory"
                value={addAccId}
                onChange={(e) => addAccessoryLine(e.target.value)}
              >
                <option value="">+ Add accessory…</option>
                {accessoryOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.qty} in stock)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300/70 px-3 py-4 text-center text-sm text-gray-500">
              No accessories added.
            </p>
          ) : (
            <ul className="glass-soft divide-y divide-white/50 rounded-lg">
              {items.map((it) => {
                const stock = accessories?.find((a) => a.id === it.accessoryId)?.qty ?? 0;
                return (
                  <li key={it.accessoryId} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                      {it.name}
                    </span>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={stock}
                        value={it.qty}
                        onChange={(e) =>
                          updateLine(it.accessoryId, {
                            qty: Math.max(1, Math.min(stock, Number(e.target.value) || 1)),
                          })
                        }
                        className="h-8 w-16 glass-input rounded-lg px-2 text-sm text-ink"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      Kč
                      <input
                        type="number"
                        min={0}
                        value={it.price}
                        onChange={(e) =>
                          updateLine(it.accessoryId, { price: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="h-8 w-24 glass-input rounded-lg px-2 text-sm text-ink"
                      />
                    </label>
                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                      {formatMoney(it.qty * it.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(it.accessoryId)}
                      aria-label={`Remove ${it.name}`}
                      className="text-gray-400 hover:text-bad"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.items && <p className="mt-1 text-xs text-bad">{errors.items}</p>}
        </section>

        {/* Money */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Input label="Discount (Kč)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input label="Sales Tax %" type="number" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)} />
          <Input label="Amount received (Kč)" type="number" value={received} onChange={(e) => setReceived(e.target.value)} />
        </section>

        {/* Totals preview */}
        <section className="glass-soft rounded-xl p-4">
          <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
            <Row label="Discount" value={`− ${formatMoney(totals.discount)}`} />
            <Row label={`Sales Tax (${Number(gstPercent) || 0}%)`} value={formatMoney(totals.gst)} />
            <div className="my-1 border-t border-line" />
            <Row label="Total" value={formatMoney(totals.total)} bold />
            <Row label="Received" value={formatMoney(totals.received)} />
            <Row label="Balance" value={formatMoney(totals.balance)} bold />
            <div className="pt-1 text-right">
              <span className="text-xs text-gray-500">Status: </span>
              <span className="text-xs font-semibold text-ink">{totals.status}</span>
            </div>
          </dl>
        </section>
      </form>
    </Modal>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "font-semibold text-ink" : "text-gray-600"}>{label}</dt>
      <dd className={`tabular-nums ${bold ? "font-semibold text-ink" : "text-gray-700"}`}>
        {value}
      </dd>
    </div>
  );
}
