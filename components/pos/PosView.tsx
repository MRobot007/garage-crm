"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  History,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  User,
  Wrench,
  Package,
  Menu,
  ChevronDown,
  Banknote,
  CreditCard,
  SplitSquareHorizontal,
  Receipt,
  Printer,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAccessories } from "@/hooks/useAccessories";
import { useSettings } from "@/hooks/useSettings";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useMe } from "@/hooks/useMe";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/components/ui/Toast";
import { ACCESSORY_CATEGORIES } from "@/lib/constants";
import { formatMoney, cn } from "@/lib/utils";
import { ApiError } from "@/lib/fetcher";
import { displayFont } from "@/lib/fonts";
import type { Accessory } from "@/lib/types";

const SERVICES_CAT = "Services";

/** Common garage services offered at the counter (price in USD). */
const PRESET_SERVICES: { name: string; price: number }[] = [
  { name: "Oil & Filter Change", price: 60 },
  { name: "Tire Rotation", price: 40 },
  { name: "Wheel Alignment", price: 90 },
  { name: "Brake Inspection", price: 50 },
  { name: "AC Service & Recharge", price: 120 },
  { name: "Full Wash & Detail", price: 150 },
  { name: "Diagnostic Scan", price: 80 },
  { name: "Battery Replacement", price: 180 },
];

interface CartLine {
  key: string;
  kind: "accessory" | "service";
  accessoryId?: string;
  name: string;
  price: number;
  qty: number;
  maxQty?: number;
  category?: string;
}

type PayMethod = "cash" | "card" | "split";

interface CompletedSale {
  invoiceNo: string;
  lines: { name: string; qty: number; price: number; kind: string }[];
  subtotal: number;
  tax: number;
  taxPct: number;
  total: number;
  method: PayMethod;
  cashPart: number;
  cardPart: number;
  change: number;
  customer: string;
  cashier: string;
  at: string;
}

const QUICK_CASH = [10, 20, 50, 100];

export function PosView() {
  const router = useRouter();
  const toast = useToast();
  const { data: accessories } = useAccessories();
  const { data: settings } = useSettings();
  const { data: me } = useMe();
  const createInvoice = useCreateInvoice();

  const taxPct = settings?.gstPercent ?? 8;
  const businessName = settings?.businessName ?? "VOZIDEX";

  const [navOpen, setNavOpen] = useState(true);
  const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet
  const [category, setCategory] = useState("Everything");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [held, setHeld] = useState<CartLine[] | null>(null);
  const [pay, setPay] = useState<PayMethod>("cash");
  const [tender, setTender] = useState(0);
  const [sale, setSale] = useState<CompletedSale | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custOpen, setCustOpen] = useState(false);

  // ---- Products (accessories) ----
  const products = useMemo(() => {
    const rows = accessories ?? [];
    const needle = q.trim().toLowerCase();
    return rows.filter((a) => {
      const inCat = category === "Everything" || a.category === category;
      const match =
        !needle ||
        a.name.toLowerCase().includes(needle) ||
        a.sku.toLowerCase().includes(needle);
      return inCat && match;
    });
  }, [accessories, category, q]);

  const serviceMatches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PRESET_SERVICES.filter((s) => !needle || s.name.toLowerCase().includes(needle));
  }, [q]);

  const showServices = category === "Everything" || category === SERVICES_CAT;
  const showProducts = category !== SERVICES_CAT;

  // ---- Cart maths ----
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = Math.round((subtotal * taxPct) / 100);
  const total = subtotal + tax;
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);
  // Cash & split use the tendered amount; split auto-covers the remainder on card.
  const cashPart = pay === "card" ? 0 : Math.min(tender, total);
  const cardPart = pay === "card" ? total : pay === "split" ? total - cashPart : 0;
  const change = pay === "card" ? 0 : Math.max(0, tender - total);
  const canComplete =
    cart.length > 0 &&
    !createInvoice.isPending &&
    (pay === "cash" ? tender >= total : true);

  // ---- Cart ops ----
  function addAccessory(a: Accessory) {
    if (a.qty <= 0) {
      toast.info(`${a.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const found = prev.find((l) => l.accessoryId === a.id);
      if (found) {
        if (found.qty >= a.qty) {
          toast.info(`Only ${a.qty} in stock`);
          return prev;
        }
        return prev.map((l) => (l.key === found.key ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        {
          key: `acc-${a.id}`,
          kind: "accessory",
          accessoryId: a.id,
          name: a.name,
          price: a.sellPrice,
          qty: 1,
          maxQty: a.qty,
          category: a.category,
        },
      ];
    });
  }

  function addService(name: string, price: number) {
    setCart((prev) => {
      const found = prev.find((l) => l.kind === "service" && l.name === name && l.price === price);
      if (found) return prev.map((l) => (l.key === found.key ? { ...l, qty: l.qty + 1 } : l));
      return [
        ...prev,
        { key: `svc-${name}-${Date.now()}`, kind: "service", name, price, qty: 1, category: SERVICES_CAT },
      ];
    });
  }

  function setQty(key: string, next: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.key === key
            ? { ...l, qty: Math.max(0, Math.min(next, l.maxQty ?? 999)) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function clearCart() {
    setCart([]);
    setTender(0);
  }

  function addManualItem() {
    const name = window.prompt("Item / service name");
    if (!name?.trim()) return;
    const priceStr = window.prompt(`Price for “${name.trim()}” (USD)`, "0");
    const price = Math.max(0, Math.round(Number(priceStr) || 0));
    addService(name.trim(), price);
  }

  function holdBill() {
    if (cart.length === 0) return;
    setHeld(cart);
    clearCart();
    toast.success("Bill held");
  }
  function resumeBill() {
    if (!held) return;
    setCart(held);
    setHeld(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  function methodNote(): string {
    if (pay === "card") return `POS · Card ${formatMoney(total)}`;
    if (pay === "split")
      return `POS · Split — cash ${formatMoney(cashPart)}, card ${formatMoney(cardPart)}`;
    return `POS · Cash — tendered ${formatMoney(tender)}, change ${formatMoney(change)}`;
  }

  async function completeSale() {
    if (!canComplete) return;
    const snapshotLines = cart.map((l) => ({
      name: l.name,
      qty: l.qty,
      price: l.price,
      kind: l.kind,
    }));
    const customer = custName.trim() || "Walk-in Customer";
    try {
      const inv = (await createInvoice.mutateAsync({
        customerName: customer,
        customerPhone: custPhone.trim() || "0000000000",
        items: cart
          .filter((l) => l.kind === "accessory")
          .map((l) => ({ accessoryId: l.accessoryId!, name: l.name, qty: l.qty, price: l.price })),
        services: cart
          .filter((l) => l.kind === "service")
          .map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        discount: 0,
        gstPercent: taxPct,
        received: total,
        notes: methodNote(),
      } as never)) as { invoiceNo?: string };

      setSale({
        invoiceNo: inv.invoiceNo ?? "",
        lines: snapshotLines,
        subtotal,
        tax,
        taxPct,
        total,
        method: pay,
        cashPart,
        cardPart,
        change,
        customer,
        cashier: me?.name ?? "",
        at: new Date().toLocaleString("en-US"),
      });
      clearCart();
      setCustName("");
      setCustPhone("");
      setCustOpen(false);
      setCartOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn’t complete the sale");
    }
  }

  // Measure the receipt at 80mm width (thermal roll) and return its height in mm,
  // so we can size the print PAGE exactly to the bill (a vertical rectangle,
  // not an A4 sheet). `size: 80mm auto` is invalid CSS, so we need a real height.
  function measureReceiptMm(): number {
    const src = document.querySelector<HTMLElement>(".pos-receipt-body");
    if (!src) return 150;
    try {
      const clone = src.cloneNode(true) as HTMLElement;
      clone.style.cssText =
        "position:absolute;left:-10000px;top:0;width:80mm;max-height:none;overflow:visible;box-sizing:border-box;padding:3mm 3mm 8mm;font-family:'Courier New',monospace;";
      document.body.appendChild(clone);
      clone.querySelectorAll<HTMLElement>("*").forEach((el) => {
        el.style.fontFamily = "'Courier New', monospace";
      });
      const px = clone.offsetHeight;
      clone.remove();
      // 96px = 25.4mm; add a small buffer so nothing spills to a 2nd page.
      return Math.max(70, Math.ceil((px * 25.4) / 96) + 4);
    } catch {
      return 150;
    }
  }

  function printReceipt() {
    // Size the page to the measured bill height, only while printing the
    // receipt (A4 invoice print is untouched). Cleanup on `afterprint`, not a
    // timer, so the page size stays applied for the whole preview.
    const heightMm = measureReceiptMm();
    const style = document.createElement("style");
    style.id = "receipt-page-size";
    style.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0 }`;
    document.head.appendChild(style);
    document.body.classList.add("printing-receipt");
    const cleanup = () => {
      document.body.classList.remove("printing-receipt");
      document.getElementById("receipt-page-size")?.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  const categories = ["Everything", ...ACCESSORY_CATEGORIES, SERVICES_CAT];

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(158deg,#f3f7f6_0%,#eef3f3_46%,#f6f3ef_100%)] text-ink">
      {/* Full navigation sidebar — every section the user can access.
          Toggled off with the hamburger for more product space. */}
      {navOpen && (
        <aside className="hidden w-60 shrink-0 flex-col bg-[linear-gradient(180deg,#0c4a45_0%,#0a3a37_50%,#062725_100%)] md:flex">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Sidebar collapsed={false} />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 border-t border-white/10 px-6 py-3 text-sm font-medium text-teal-50/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" /> Log out
          </button>
        </aside>
      )}

      {/* Category rail */}
      <aside className="hidden w-28 shrink-0 overflow-y-auto border-r border-line/70 bg-white/40 px-2 py-4 sm:block">
        <div className="space-y-2">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl border px-1.5 py-3 text-center text-[11px] font-semibold leading-tight transition-all",
                  active
                    ? "border-transparent bg-gradient-to-br from-brand to-teal-700 text-white shadow-md shadow-brand/25"
                    : "border-line bg-white/70 text-slate-500 hover:border-brand/40 hover:text-ink",
                )}
              >
                {c === SERVICES_CAT ? (
                  <Wrench className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                <span className="line-clamp-2">{c}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Products */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-line/70 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNavOpen((o) => !o)}
                aria-label="Toggle navigation"
                title="Toggle navigation"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-500/10 hover:text-ink"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className={cn(displayFont.className, "flex items-center gap-2 text-2xl font-bold uppercase tracking-wide text-ink")}>
                  VOZIDEX POS
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
                </h1>
                <p className="text-xs font-medium uppercase tracking-wider text-brand">
                  Terminal secured &amp; live
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TopButton onClick={addManualItem} icon={<Plus className="h-4 w-4" />}>
                Manual item
              </TopButton>
              {held && (
                <TopButton onClick={resumeBill} icon={<History className="h-4 w-4" />}>
                  Resume (1)
                </TopButton>
              )}
              <TopButton onClick={() => setCustOpen((o) => !o)} icon={<User className="h-4 w-4" />} primary>
                Add customer
              </TopButton>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products or services…"
              className="glass-input h-11 w-full rounded-xl pl-10 pr-3 text-sm outline-none"
            />
          </div>

          <AnimatePresence>
            {custOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Customer name (optional)"
                    className="glass-input h-9 w-48 rounded-lg px-3 text-sm outline-none"
                  />
                  <input
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="Phone"
                    className="glass-input h-9 w-40 rounded-lg px-3 text-sm outline-none"
                  />
                  <span className="text-xs text-slate-400">Leave blank for a walk-in sale.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Mobile category chips (the vertical rail is hidden below sm) */}
        <div className="flex gap-2 overflow-x-auto border-b border-line/70 px-4 py-2 sm:hidden">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                category === c
                  ? "bg-gradient-to-b from-brand to-teal-700 text-white"
                  : "glass-soft text-slate-500",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-5 lg:pb-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {showServices &&
              serviceMatches.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addService(s.name, s.price)}
                  className="glass group flex flex-col rounded-2xl p-3 text-left transition-transform hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">
                      Service
                    </span>
                  </div>
                  <div className="mb-3 grid h-16 place-items-center rounded-xl bg-brand/5 text-brand">
                    <Wrench className="h-7 w-7" />
                  </div>
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                    {formatMoney(s.price)}
                  </p>
                </button>
              ))}

            {showProducts &&
              products.map((a) => {
                const out = a.qty <= 0;
                return (
                  <button
                    key={a.id}
                    onClick={() => addAccessory(a)}
                    disabled={out}
                    className={cn(
                      "glass group flex flex-col rounded-2xl p-3 text-left transition-transform",
                      out ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase",
                          a.lowStock ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700",
                        )}
                      >
                        {a.qty} in stock
                      </span>
                    </div>
                    <div className="mb-3 grid h-16 place-items-center rounded-xl bg-slate-500/5 text-slate-400">
                      <Package className="h-7 w-7" />
                    </div>
                    <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                    <div className="mt-0.5 flex items-baseline justify-between gap-2">
                      <p className="text-base font-semibold tabular-nums text-ink">
                        {formatMoney(a.sellPrice)}
                      </p>
                      <span className="truncate text-[11px] uppercase text-brand">{a.category}</span>
                    </div>
                  </button>
                );
              })}

            {showProducts && products.length === 0 && !showServices && (
              <p className="col-span-full py-16 text-center text-sm text-slate-400">
                No products match.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Checkout — static right column on desktop, slide-up sheet on mobile */}
      <aside
        className={cn(
          "flex flex-col border-line/70 bg-white/85 backdrop-blur",
          "lg:w-[360px] lg:shrink-0 lg:border-l xl:w-[380px]",
          "fixed inset-x-0 bottom-0 top-14 z-40 rounded-t-2xl border-t shadow-2xl transition-transform duration-300",
          "lg:static lg:inset-auto lg:top-auto lg:rounded-none lg:border-t-0 lg:shadow-none lg:transition-none",
          cartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              Checkout
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            </h2>
          </div>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            title="Clear cart"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-bad disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Payment method */}
        <div className="grid grid-cols-3 gap-2 px-5">
          {(["cash", "card", "split"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPay(m)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold capitalize transition-all",
                pay === m
                  ? "bg-gradient-to-b from-brand to-teal-700 text-white shadow-md shadow-brand/25"
                  : "glass-soft text-slate-500 hover:text-ink",
              )}
            >
              {m === "cash" ? (
                <Banknote className="h-4 w-4" />
              ) : m === "card" ? (
                <CreditCard className="h-4 w-4" />
              ) : (
                <SplitSquareHorizontal className="h-4 w-4" />
              )}
              {m}
            </button>
          ))}
        </div>

        {/* Cash / split tender */}
        {pay !== "card" && (
          <div className="mt-3 px-5">
            <div className="rounded-xl bg-teal-50/70 p-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {pay === "split" ? "Cash part $" : "Received $"}
                </label>
                <span className="text-xs text-slate-500">
                  Change{" "}
                  <span className="font-semibold text-ok">{formatMoney(change)}</span>
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={tender || ""}
                onChange={(e) => setTender(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0.00"
                className="mt-1 w-full bg-transparent text-2xl font-semibold tabular-nums text-ink outline-none"
              />
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {QUICK_CASH.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTender((t) => t + amt)}
                    className="rounded-lg border border-teal-200 bg-white/70 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
              {pay === "split" && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="h-4 w-4 text-brand" /> On card
                  </span>
                  <span className="font-semibold tabular-nums text-ink">{formatMoney(cardPart)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {pay === "card" && (
          <div className="mt-3 px-5">
            <div className="flex items-center gap-2 rounded-xl bg-teal-50/70 p-3 text-sm text-slate-600">
              <CreditCard className="h-4 w-4 text-brand" />
              Charge <span className="font-semibold text-ink">{formatMoney(total)}</span> to card
            </div>
          </div>
        )}

        {/* Cart lines */}
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Bill items · {cart.length}
          </p>
          {cart.length === 0 ? (
            <div className="grid place-items-center py-14 text-center text-slate-300">
              <ShoppingCart className="h-12 w-12" />
              <p className="mt-2 text-sm font-medium text-slate-400">Empty cart</p>
              <p className="text-xs text-slate-400">Tap a product or service to add it.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.key} className="glass-soft flex items-center gap-2 rounded-xl p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(l.price)}
                      {l.kind === "service" && " · service"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQty(l.key, l.qty - 1)}
                      className="grid h-6 w-6 place-items-center rounded-md bg-white/80 text-slate-600 hover:bg-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.key, l.qty + 1)}
                      disabled={l.maxQty !== undefined && l.qty >= l.maxQty}
                      className="grid h-6 w-6 place-items-center rounded-md bg-white/80 text-slate-600 hover:bg-white disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums text-ink">
                    {formatMoney(l.price * l.qty)}
                  </span>
                  <button
                    onClick={() => removeLine(l.key)}
                    className="grid h-6 w-6 place-items-center rounded-md text-slate-300 hover:text-bad"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + actions */}
        <div className="border-t border-line/70 px-5 py-4">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Tax ({taxPct}%)</dt>
              <dd className="tabular-nums">{formatMoney(tax)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-line/70 pt-2">
              <dt className="font-semibold text-ink">Grand total</dt>
              <dd className="text-xl font-bold tabular-nums text-ink">{formatMoney(total)}</dd>
            </div>
          </dl>

          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <button
              onClick={holdBill}
              disabled={cart.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <Receipt className="h-4 w-4" /> Hold
            </button>
            <button
              onClick={completeSale}
              disabled={!canComplete}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand to-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:brightness-[1.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {createInvoice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {pay === "cash" && tender > 0 && tender < total
                ? "Insufficient cash"
                : "Complete payment"}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bar to open the cart sheet */}
      {!cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-brand to-teal-700 px-5 py-3.5 text-white shadow-2xl lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
          <span className="font-bold tabular-nums">
            {formatMoney(total)} · View cart
          </span>
        </button>
      )}

      {/* Receipt after a completed sale */}
      <AnimatePresence>
        {sale && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="pos-receipt w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="pos-receipt-body max-h-[80vh] overflow-y-auto p-6">
                <div className="mb-4 text-center">
                  <p className={cn(displayFont.className, "text-2xl font-bold uppercase tracking-wide text-ink")}>
                    {businessName}
                  </p>
                  <p className="text-xs text-slate-500">Sales Receipt</p>
                </div>
                <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Payment complete
                </div>

                <dl className="mb-3 space-y-0.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <dt>Receipt</dt>
                    <dd className="font-medium text-ink">{sale.invoiceNo}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Date</dt>
                    <dd>{sale.at}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Customer</dt>
                    <dd>{sale.customer}</dd>
                  </div>
                  {sale.cashier && (
                    <div className="flex justify-between">
                      <dt>Cashier</dt>
                      <dd>{sale.cashier}</dd>
                    </div>
                  )}
                </dl>

                <div className="border-y border-dashed border-line py-2">
                  <table className="w-full text-sm">
                    <tbody>
                      {sale.lines.map((l, i) => (
                        <tr key={i} className="align-top">
                          <td className="py-1 pr-2">
                            {l.name}
                            <span className="text-slate-400"> ×{l.qty}</span>
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            {formatMoney(l.price * l.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <dl className="space-y-1 py-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">{formatMoney(sale.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <dt>Tax ({sale.taxPct}%)</dt>
                    <dd className="tabular-nums">{formatMoney(sale.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1 text-base font-bold text-ink">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatMoney(sale.total)}</dd>
                  </div>
                </dl>

                <dl className="space-y-0.5 rounded-lg bg-slate-500/5 p-3 text-sm">
                  {sale.method === "split" ? (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <dt>Cash</dt>
                        <dd className="tabular-nums">{formatMoney(sale.cashPart)}</dd>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <dt>Card</dt>
                        <dd className="tabular-nums">{formatMoney(sale.cardPart)}</dd>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500">
                      <dt className="capitalize">{sale.method}</dt>
                      <dd className="tabular-nums">{formatMoney(sale.total)}</dd>
                    </div>
                  )}
                  {sale.change > 0 && (
                    <div className="flex justify-between font-semibold text-ok">
                      <dt>Change</dt>
                      <dd className="tabular-nums">{formatMoney(sale.change)}</dd>
                    </div>
                  )}
                </dl>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Thank you for your business!
                </p>
              </div>

              <div className="pos-print-hide grid grid-cols-2 gap-2 border-t border-line p-4">
                <button
                  onClick={printReceipt}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" /> Print
                </button>
                <button
                  onClick={() => setSale(null)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand to-teal-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:brightness-[1.08] active:scale-[0.97]"
                >
                  New sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopButton({
  children,
  onClick,
  icon,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all active:scale-[0.97]",
        primary
          ? "bg-gradient-to-b from-brand to-teal-700 text-white shadow-md shadow-brand/25 hover:brightness-[1.08]"
          : "glass-soft text-slate-600 hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
