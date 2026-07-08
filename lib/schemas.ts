import { z } from "zod";
import {
  CAR_STATUSES,
  CAR_TYPES,
  INVOICE_STATUSES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "./constants";

// Coerce optional-empty-string form fields into undefined. Length-capped so
// public/unauthenticated endpoints (e.g. website lead capture) can't be used to
// store unbounded blobs.
const optionalStr = z
  .string()
  .trim()
  .max(1000, "Too long")
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long");

const nonNegInt = z.coerce
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative");

const positiveIntFromNow = z.coerce.number().int().min(0);

// ----------------------------- Lead -----------------------------
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120, "Name is too long"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(200, "Email is too long")
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  // Chosen accessory name (used to trigger the in-stock confirmation email).
  accessory: optionalStr,
  interestedIn: optionalStr,
  source: z.enum(LEAD_SOURCES).default("Walk-in"),
  status: z.enum(LEAD_STATUSES).default("New"),
  followUpDate: optionalStr, // ISO date string (YYYY-MM-DD) or undefined
  staff: optionalStr,
  notes: optionalStr,
});
export type LeadInput = z.input<typeof leadSchema>;
export type LeadValues = z.infer<typeof leadSchema>;

// ----------------------------- Car ------------------------------
export const carBaseSchema = z.object({
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z.coerce
    .number()
    .int()
    .min(1950, "Enter a valid year")
    .max(new Date().getFullYear() + 1, "Year looks too far in the future"),
  type: z.enum(CAR_TYPES).default("Used"),
  regNo: z.string().trim().min(1, "Registration number is required"),
  km: nonNegInt.default(0),
  costPrice: nonNegInt,
  askingPrice: nonNegInt,
  status: z.enum(CAR_STATUSES).default("Available"),
});
// Full-create schema (base + cross-field checks). Use carBaseSchema.partial() for PATCH.
export const carSchema = carBaseSchema;
export type CarInput = z.input<typeof carSchema>;
export type CarValues = z.infer<typeof carSchema>;

// -------------------------- Accessory ---------------------------
export const accessorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().min(1, "Category is required"),
  qty: nonNegInt.default(0),
  costPrice: nonNegInt,
  sellPrice: nonNegInt,
  reorderLevel: nonNegInt.default(5),
  supplier: optionalStr,
});
export type AccessoryInput = z.input<typeof accessorySchema>;
export type AccessoryValues = z.infer<typeof accessorySchema>;

export const adjustStockSchema = z.object({
  delta: z.coerce.number().int(),
});

// --------------------------- Customer ---------------------------
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type CustomerValues = z.infer<typeof customerSchema>;

// ---------------------------- Invoice ---------------------------
export const invoiceItemSchema = z.object({
  accessoryId: z.string().min(1, "Pick an accessory"),
  name: z.string().min(1),
  qty: z.coerce.number().int().min(1, "Qty must be at least 1"),
  price: nonNegInt,
});

// A manual / service line (e.g. labour, a garage service, or a custom item).
// It has no catalog entry, so its price is entered at the point of sale.
export const serviceItemSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  qty: z.coerce.number().int().min(1, "Qty must be at least 1").max(999),
  price: nonNegInt,
});

export const invoiceSchema = z
  .object({
    // customer: either an existing id, or new name+phone.
    customerId: optionalStr,
    customerName: optionalStr,
    customerPhone: optionalStr,
    customerEmail: optionalStr,
    carId: optionalStr,
    items: z.array(invoiceItemSchema).default([]),
    services: z.array(serviceItemSchema).default([]),
    discount: nonNegInt.default(0),
    gstPercent: nonNegInt.default(8),
    received: nonNegInt.default(0),
    staff: optionalStr,
    notes: optionalStr,
  })
  .refine((v) => Boolean(v.customerId) || Boolean(v.customerName && v.customerPhone), {
    message: "Choose a customer or enter a name and phone",
    path: ["customerName"],
  })
  .refine(
    (v) =>
      Boolean(v.carId) ||
      (v.items && v.items.length > 0) ||
      (v.services && v.services.length > 0),
    {
      message: "Add a car, an accessory, or a service",
      path: ["items"],
    },
  );
export type InvoiceInput = z.input<typeof invoiceSchema>;
export type InvoiceValues = z.infer<typeof invoiceSchema>;

// ---------------------------- Supplier --------------------------
export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  phone: optionalStr,
  notes: optionalStr,
});
export type SupplierValues = z.infer<typeof supplierSchema>;

// ---------------------------- Order -----------------------------
export const orderItemSchema = z.object({
  kind: z.enum(["accessory", "custom"]).default("custom"),
  accessoryId: optionalStr,
  name: z.string().trim().min(1, "Item name is required"),
  qty: z.coerce.number().int().min(1, "Qty must be at least 1"),
});

export const orderSchema = z.object({
  supplierId: z.string().min(1, "Choose a supplier"),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Message is required"),
  notes: optionalStr,
  send: z.boolean().default(true),
});
export type OrderValues = z.infer<typeof orderSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(["Draft", "Sent", "Received"]),
});

// ----------------------------- Users ----------------------------
export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, . _ - only"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["owner", "manager", "staff"]).default("staff"),
});
export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").optional(),
  role: z.enum(["owner", "manager", "staff"]).optional(),
  active: z.boolean().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

// ---------------------------- Settings --------------------------
export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  currency: z.string().trim().min(1).default("₹"),
  gstPercent: positiveIntFromNow.max(100, "Tax cannot exceed 100%").default(8),
});
export type SettingsValues = z.infer<typeof settingsSchema>;
