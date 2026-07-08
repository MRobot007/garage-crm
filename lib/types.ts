// Client-facing shapes (JSON-serialised: dates are ISO strings).

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  accessory: string | null;
  interestedIn: string | null;
  source: string;
  status: string;
  followUpDate: string | null;
  staff: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  regNo: string;
  km: number;
  costPrice: number;
  askingPrice: number;
  status: string;
  addedDate: string;
  updatedAt: string;
  // computed by the API
  margin: number;
  daysInStock: number;
  invoice?: { id: string; invoiceNo: string } | null;
}

export interface Accessory {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  costPrice: number;
  sellPrice: number;
  reorderLevel: number;
  supplier: string | null;
  createdAt: string;
  updatedAt: string;
  lowStock: boolean;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  accessoryId: string | null;
  kind: string;
  name: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customer: { id: string; name: string; phone: string } | null;
  carId: string | null;
  car: { id: string; make: string; model: string; year: number } | null;
  date: string;
  discount: number;
  gstPercent: number;
  subtotal: number;
  gst: number;
  total: number;
  received: number;
  balance: number;
  status: string;
  staff: string | null;
  notes: string | null;
  items: InvoiceItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  // computed
  carsPurchased: number;
  totalSpent: number;
  lastPurchase: string | null;
  invoices?: Invoice[];
}

export interface TrendPoint {
  label: string;
  leads: number;
  /** Invoice total for the bucket. */
  sales: number;
}

export type TrendRange = "today" | "week" | "month" | "sixMonths" | "year";

export interface DashboardData {
  totals: {
    leads: number;
    carsInStock: number;
    accessoryUnits: number;
    salesThisMonth: number;
    pendingPayments: number;
  };
  /** Percent change over the last 7 days vs the prior 7 days (null when no prior data). */
  deltas: {
    leads: number | null;
    sales: number | null;
  };
  /** Time-series per selectable range, each oldest → newest. */
  trend: Record<TrendRange, TrendPoint[]>;
  funnel: { stage: string; count: number }[];
  recentLeads: Pick<
    Lead,
    "id" | "name" | "interestedIn" | "source" | "status" | "createdAt"
  >[];
  followUpsToday: Pick<
    Lead,
    "id" | "name" | "phone" | "interestedIn" | "status" | "followUpDate" | "staff"
  >[];
  lowStock: Pick<Accessory, "id" | "name" | "sku" | "qty" | "reorderLevel">[];
}

export interface ReportsData {
  revenueSplit: { cars: number; accessories: number };
  salesByStaff: { staff: string; count: number; revenue: number }[];
  leadsBySource: {
    source: string;
    total: number;
    won: number;
    conversion: number;
  }[];
  deadStockCars: {
    id: string;
    make: string;
    model: string;
    year: number;
    daysInStock: number;
    askingPrice: number;
  }[];
  slowAccessories: {
    id: string;
    name: string;
    sku: string;
    qty: number;
  }[];
  month: string;
}

export interface Settings {
  businessName: string;
  currency: string;
  gstPercent: number;
}

export interface CrmUser {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface Me {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
}

export interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  createdAt: string;
}

export interface ShiftEntry {
  id: string;
  startedAt: string;
  endedAt: string | null;
  salesCount: number;
  salesTotal: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  kind: string;
  accessoryId: string | null;
  name: string;
  qty: number;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplier: { id: string; name: string; email: string | null } | null;
  date: string;
  status: string;
  emailTo: string | null;
  subject: string | null;
  body: string | null;
  emailedVia: string | null;
  notes: string | null;
  items: OrderItem[];
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // computed
  orderCount: number;
  lastOrder: string | null;
  orders?: PurchaseOrder[];
}
