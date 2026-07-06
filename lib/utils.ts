// Small formatting/util helpers shared across client & server.

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Format a whole-dollar amount as US currency, e.g. $18,900. */
export function formatMoney(amount: number | null | undefined): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return USD.format(Math.round(n));
}

/** Format a plain number with US grouping (no currency symbol). */
export function formatNumber(n: number | null | undefined): string {
  return NUM.format(typeof n === "number" && Number.isFinite(n) ? n : 0);
}

/** Short date like 6 Jul 2026. */
export function formatDate(
  d: string | Date | null | undefined,
): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** For <input type="date"> value binding: YYYY-MM-DD. */
export function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Whole-day difference between now and a past date. */
export function daysSince(d: string | Date): number {
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** True when the date falls on today (local). */
export function isToday(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** True when a follow-up date is today or already past. */
export function isDueOrOverdue(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return date.getTime() <= end.getTime();
}

/** Join class names, dropping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Respect the user's reduced-motion preference (client-only). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
