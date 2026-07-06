// Shared domain constants (enums-as-strings kept in one place).

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "TestDrive",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// Order shown in the sales funnel (Lost is excluded from the funnel).
export const FUNNEL_STAGES: LeadStatus[] = [
  "New",
  "Contacted",
  "TestDrive",
  "Negotiation",
  "Won",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  New: "New",
  Contacted: "Contacted",
  TestDrive: "Test Drive",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
};

export const LEAD_SOURCES = [
  "Walk-in",
  "WhatsApp",
  "Website",
  "Marketplace",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const CAR_STATUSES = ["Available", "Reserved", "Sold"] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

export const CAR_TYPES = ["New", "Used"] as const;
export type CarType = (typeof CAR_TYPES)[number];

export const INVOICE_STATUSES = ["Paid", "Partial", "Pending"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const ACCESSORY_CATEGORIES = [
  "Audio",
  "Wheels",
  "Interior",
  "Lighting",
  "Exterior",
  "Safety",
  "Other",
] as const;

// Business rules
export const DEFAULT_GST_PERCENT = 8;
export const DEAD_STOCK_DAYS = 60; // car aging threshold for reports
