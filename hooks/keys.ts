// Centralised TanStack Query keys so mutations invalidate consistently.

export const qk = {
  leads: ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
  cars: ["cars"] as const,
  car: (id: string) => ["cars", id] as const,
  accessories: ["accessories"] as const,
  accessory: (id: string) => ["accessories", id] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customers", id] as const,
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
  suppliers: ["suppliers"] as const,
  supplier: (id: string) => ["suppliers", id] as const,
  orders: ["orders"] as const,
  dashboard: ["dashboard"] as const,
  reports: ["reports"] as const,
  settings: ["settings"] as const,
  users: ["users"] as const,
  me: ["me"] as const,
  audit: ["audit"] as const,
};

// Entities whose changes affect dashboard/report aggregates.
export const AGGREGATE_KEYS = [
  ["dashboard"],
  ["reports"],
] as const;
