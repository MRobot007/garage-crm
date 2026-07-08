"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { AccessoryModal } from "./AccessoryModal";
import {
  useAccessories,
  useAdjustStock,
  useDeleteAccessory,
} from "@/hooks/useAccessories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSettings } from "@/hooks/useSettings";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { buildGmailCompose } from "@/lib/order-compose";
import { ACCESSORY_CATEGORIES } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import type { Accessory, Supplier } from "@/lib/types";

/** Best-effort match of an accessory's supplier name to a Supplier record's email. */
function findSupplierEmail(name: string | null, suppliers: Supplier[]): string {
  if (!name) return "";
  const n = name.trim().toLowerCase();
  const match = suppliers.find((s) => {
    const sn = s.name.trim().toLowerCase();
    return sn === n || sn.includes(n) || n.includes(sn);
  });
  return match?.email ?? "";
}

/** Pre-filled Gmail compose URL for a low-stock reorder request to the supplier. */
function reorderComposeUrl(a: Accessory, to: string, businessName: string): string {
  const requested = Math.max(a.reorderLevel * 2 - a.qty, a.reorderLevel);
  const subject = `Reorder request — ${a.name} (${a.sku})`;
  const body = [
    `Hello${a.supplier ? ` ${a.supplier}` : ""},`,
    ``,
    `We're running low on the item below and would like to reorder:`,
    ``,
    `• Item: ${a.name}`,
    `• SKU: ${a.sku}`,
    `• Current stock: ${a.qty}`,
    `• Reorder level: ${a.reorderLevel}`,
    `• Requested quantity: ${requested}`,
    ``,
    `Please confirm availability, price and lead time.`,
    ``,
    `Thank you,`,
    businessName,
  ].join("\n");
  return buildGmailCompose(to, subject, body);
}

export function AccessoriesView() {
  const toast = useToast();
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const filters = useMemo(() => ({ category, q, lowOnly }), [category, q, lowOnly]);
  const { data: rows, isLoading, isError } = useAccessories(filters);
  const { data: suppliers } = useSuppliers();
  const { data: settings } = useSettings();
  const adjust = useAdjustStock();
  const del = useDeleteAccessory();

  const businessName = settings?.businessName ?? "VOZIDEX";

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [toDelete, setToDelete] = useState<Accessory | null>(null);

  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", rows?.length ?? 0);

  async function onAdjust(a: Accessory, delta: number) {
    try {
      await adjust.mutateAsync({ id: a.id, delta });
    } catch {
      toast.error("Couldn’t adjust stock");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Accessory deleted");
      setToDelete(null);
    } catch {
      toast.error("Couldn’t delete accessory");
      setToDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Accessories"
        subtitle="Stock levels, pricing and low-stock alerts."
        actions={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + Add accessory
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search accessories"
            placeholder="Search name, SKU, supplier…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-44"
          options={[
            { value: "all", label: "All categories" },
            ...ACCESSORY_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
        />
        <label className="glass-soft flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Low stock only
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading accessories…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load accessories.</p>
      )}

      {rows && rows.length === 0 && (
        <EmptyState
          title="No accessories"
          description="Add an accessory SKU to start tracking stock."
          actionLabel="+ Add accessory"
          onAction={() => { setEditing(null); setModalOpen(true); }}
        />
      )}

      {rows && rows.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>SKU</TH>
              <TH>Category</TH>
              <TH className="text-center">Stock</TH>
              <TH className="text-right">Cost</TH>
              <TH className="text-right">Sell</TH>
              <TH>Supplier</TH>
              <TH>Reorder</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {rows.map((a) => (
              <TR key={a.id} className={a.lowStock ? "bg-red-50/60 hover:bg-red-50" : ""}>
                <TD className="font-medium">{a.name}</TD>
                <TD className="whitespace-nowrap text-gray-600">{a.sku}</TD>
                <TD>
                  <Badge tone="neutral">{a.category}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      aria-label={`Decrease ${a.name}`}
                      onClick={() => onAdjust(a, -1)}
                      disabled={a.qty <= 0}
                      className="grid h-7 w-7 place-items-center glass-soft rounded-lg text-gray-600 hover:bg-white/70 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span
                      className={`min-w-8 text-center tabular-nums ${a.lowStock ? "font-semibold text-bad" : "text-ink"}`}
                    >
                      {a.qty}
                    </span>
                    <button
                      aria-label={`Increase ${a.name}`}
                      onClick={() => onAdjust(a, 1)}
                      className="grid h-7 w-7 place-items-center glass-soft rounded-lg text-gray-600 hover:bg-white/70"
                    >
                      +
                    </button>
                  </div>
                  {a.lowStock && (
                    <p className="mt-1 text-center text-[11px] text-bad">
                      ≤ reorder {a.reorderLevel}
                    </p>
                  )}
                </TD>
                <TD className="text-right tabular-nums text-gray-600">{formatMoney(a.costPrice)}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMoney(a.sellPrice)}</TD>
                <TD className="text-gray-600">{a.supplier || "—"}</TD>
                <TD>
                  {a.lowStock ? (
                    <a
                      href={reorderComposeUrl(
                        a,
                        findSupplierEmail(a.supplier, suppliers ?? []),
                        businessName,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-brand transition-colors hover:bg-brand/10"
                      title={`Email ${a.supplier ?? "the supplier"} to reorder ${a.name}`}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">In stock</span>
                  )}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setModalOpen(true); }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bad hover:bg-red-50"
                      onClick={() => setToDelete(a)}
                    >
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}

      <AccessoryModal open={modalOpen} onClose={() => setModalOpen(false)} accessory={editing} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete accessory?"
        message={`Remove ${toDelete?.name} (${toDelete?.sku})? This can’t be undone.`}
        confirmLabel="Delete"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
