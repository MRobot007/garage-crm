import type { PrismaClient } from "@prisma/client";
import { computeTotals } from "./calc";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
const daysAgo = (n: number) => daysFromNow(-n);

const TAX = 8; // default US sales tax %

/**
 * Populate the database with demo data for a US car dealership.
 * Idempotent: clears existing rows first. Shared by `prisma/seed.ts` (CLI)
 * and the "Reset demo data" API route. Prices in whole US dollars.
 */
export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  // Clear in dependency order.
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.car.deleteMany();
  await prisma.accessory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.lead.deleteMany();

  await prisma.setting.upsert({
    where: { id: "default" },
    update: { businessName: "Summit Auto Group", currency: "$", gstPercent: TAX },
    create: { id: "default", businessName: "Summit Auto Group", currency: "$", gstPercent: TAX },
  });

  // ---------------- Cars (odometer in miles, prices in USD) ----------------
  const cars = await Promise.all(
    [
      { make: "Toyota", model: "Camry SE", year: 2021, type: "Used", regNo: "7XYZ123", km: 34200, costPrice: 16500, askingPrice: 18900, status: "Available", addedDate: daysAgo(12) },
      { make: "Honda", model: "Civic EX", year: 2022, type: "Used", regNo: "8ABC456", km: 22100, costPrice: 19000, askingPrice: 21500, status: "Available", addedDate: daysAgo(75) },
      { make: "Ford", model: "F-150 XLT", year: 2020, type: "Used", regNo: "TX-5521", km: 48900, costPrice: 28500, askingPrice: 32000, status: "Reserved", addedDate: daysAgo(6) },
      { make: "Tesla", model: "Model 3", year: 2022, type: "Used", regNo: "CA-9KJ21", km: 18400, costPrice: 31000, askingPrice: 34900, status: "Available", addedDate: daysAgo(30) },
      { make: "Chevrolet", model: "Equinox LT", year: 2021, type: "Used", regNo: "6DEF789", km: 27600, costPrice: 20800, askingPrice: 23400, status: "Available", addedDate: daysAgo(3) },
    ].map((data) => prisma.car.create({ data })),
  );

  // ---------------- Accessories (prices in USD) ----------------
  const acc = await Promise.all(
    [
      { name: 'Android Head Unit 10"', sku: "AUD-STR-10", category: "Audio", qty: 14, costPrice: 95, sellPrice: 149, reorderLevel: 5, supplier: "SoundKing" },
      { name: 'Alloy Wheels 18" (set)', sku: "WHL-ALY-18", category: "Wheels", qty: 4, costPrice: 480, sellPrice: 720, reorderLevel: 3, supplier: "WheelCraft" },
      { name: "Leather Seat Covers", sku: "INT-SC-STD", category: "Interior", qty: 9, costPrice: 120, sellPrice: 189, reorderLevel: 4, supplier: "AutoDecor" },
      { name: "LED Headlight Kit", sku: "LGT-LED-HL", category: "Lighting", qty: 2, costPrice: 55, sellPrice: 89, reorderLevel: 5, supplier: "BrightAuto" },
      { name: "Dashcam 4K", sku: "SAF-DC-4K", category: "Safety", qty: 11, costPrice: 90, sellPrice: 149, reorderLevel: 4, supplier: "GuardTech" },
      { name: "All-Weather Floor Mats", sku: "INT-MAT-AW", category: "Interior", qty: 25, costPrice: 40, sellPrice: 69, reorderLevel: 8, supplier: "AutoDecor" },
      { name: "Ceramic Coating Kit", sku: "EXT-CC-KIT", category: "Exterior", qty: 6, costPrice: 130, sellPrice: 199, reorderLevel: 3, supplier: "ShineLab" },
      { name: "Backup Parking Sensors", sku: "SAF-PS-04", category: "Safety", qty: 3, costPrice: 45, sellPrice: 79, reorderLevel: 5, supplier: "GuardTech" },
      { name: "Air Freshener (3-pack)", sku: "INT-AF-3", category: "Interior", qty: 40, costPrice: 6, sellPrice: 14, reorderLevel: 10, supplier: "FreshDrive" },
      { name: "Premium Car Cover", sku: "EXT-BC-PRM", category: "Exterior", qty: 1, costPrice: 35, sellPrice: 59, reorderLevel: 4, supplier: "ShineLab" },
    ].map((data) => prisma.accessory.create({ data })),
  );

  // ---------------- Customers (US) ----------------
  const [c1, c2, c3] = await Promise.all(
    [
      { name: "Michael Johnson", phone: "+1 (512) 555-0143", email: "michael.johnson@example.com" },
      { name: "Jessica Williams", phone: "+1 (415) 555-0178", email: "jessica.williams@example.com" },
      { name: "David Martinez", phone: "+1 (312) 555-0192", email: null as string | null },
    ].map((data) => prisma.customer.create({ data })),
  );

  // ---------------- Invoices (tax 8%) ----------------
  // Invoice 1: Tesla Model 3 + head unit + floor mats — paid.
  const inv1Car = cars[3];
  const inv1Lines = [
    { acc: acc[0], qty: 1 },
    { acc: acc[5], qty: 2 },
  ];
  const t1 = computeTotals({
    items: inv1Lines.map((l) => ({ qty: l.qty, price: l.acc.sellPrice })),
    carPrice: inv1Car.askingPrice,
    discount: 500,
    gstPercent: TAX,
    received: 0,
  });
  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-0001",
      customerId: c1.id,
      carId: inv1Car.id,
      date: daysAgo(4),
      discount: 500,
      gstPercent: TAX,
      subtotal: t1.subtotal,
      gst: t1.gst,
      total: t1.total,
      received: t1.total,
      status: "Paid",
      staff: "Mike",
      items: {
        create: [
          { kind: "car", name: `${inv1Car.make} ${inv1Car.model} ${inv1Car.year}`, qty: 1, price: inv1Car.askingPrice },
          ...inv1Lines.map((l) => ({ kind: "accessory", accessoryId: l.acc.id, name: l.acc.name, qty: l.qty, price: l.acc.sellPrice })),
        ],
      },
    },
  });
  await prisma.car.update({ where: { id: inv1Car.id }, data: { status: "Sold" } });
  await prisma.accessory.update({ where: { id: acc[0].id }, data: { qty: { decrement: 1 } } });
  await prisma.accessory.update({ where: { id: acc[5].id }, data: { qty: { decrement: 2 } } });

  // Invoice 2: accessories only — partial.
  const inv2Lines = [
    { acc: acc[4], qty: 1 },
    { acc: acc[8], qty: 2 },
  ];
  const t2 = computeTotals({
    items: inv2Lines.map((l) => ({ qty: l.qty, price: l.acc.sellPrice })),
    discount: 0,
    gstPercent: TAX,
    received: 100,
  });
  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-0002",
      customerId: c2.id,
      date: daysAgo(1),
      discount: 0,
      gstPercent: TAX,
      subtotal: t2.subtotal,
      gst: t2.gst,
      total: t2.total,
      received: 100,
      status: t2.status,
      staff: "Sara",
      items: {
        create: inv2Lines.map((l) => ({ kind: "accessory", accessoryId: l.acc.id, name: l.acc.name, qty: l.qty, price: l.acc.sellPrice })),
      },
    },
  });
  await prisma.accessory.update({ where: { id: acc[4].id }, data: { qty: { decrement: 1 } } });
  await prisma.accessory.update({ where: { id: acc[8].id }, data: { qty: { decrement: 2 } } });

  // Invoice 3: Toyota Camry only — pending.
  const inv3Car = cars[0];
  const t3 = computeTotals({ items: [], carPrice: inv3Car.askingPrice, discount: 300, gstPercent: TAX, received: 0 });
  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-0003",
      customerId: c3.id,
      date: daysAgo(0),
      discount: 300,
      gstPercent: TAX,
      subtotal: t3.subtotal,
      gst: t3.gst,
      total: t3.total,
      received: 0,
      status: "Pending",
      staff: "Mike",
      items: {
        create: [{ kind: "car", name: `${inv3Car.make} ${inv3Car.model} ${inv3Car.year}`, qty: 1, price: inv3Car.askingPrice }],
      },
    },
  });
  await prisma.car.update({ where: { id: inv3Car.id }, data: { status: "Sold" } });

  // ---------------- Leads (US) ----------------
  await prisma.lead.createMany({
    data: [
      { name: "Robert Brown", phone: "+1 (512) 555-0111", interestedIn: "Honda Civic", source: "Website", status: "New", followUpDate: daysFromNow(0), staff: "Mike", createdAt: daysAgo(1) },
      { name: "Emily Davis", phone: "+1 (917) 555-0133", interestedIn: "Alloy wheels + coating", source: "WhatsApp", status: "Contacted", followUpDate: daysFromNow(0), staff: "Sara", createdAt: daysAgo(2) },
      { name: "James Wilson", phone: "+1 (312) 555-0155", interestedIn: "Ford F-150", source: "Walk-in", status: "TestDrive", followUpDate: daysFromNow(1), staff: "Mike", createdAt: daysAgo(3) },
      { name: "Ashley Garcia", phone: "+1 (415) 555-0166", interestedIn: "Tesla Model 3", source: "Marketplace", status: "Negotiation", followUpDate: daysFromNow(2), staff: "Sara", createdAt: daysAgo(5) },
      { name: "Christopher Lee", phone: "+1 (206) 555-0177", interestedIn: "Toyota Camry", source: "Website", status: "Won", staff: "Mike", createdAt: daysAgo(6) },
      { name: "Amanda Taylor", phone: "+1 (305) 555-0188", interestedIn: "Dashcam install", source: "Walk-in", status: "Lost", notes: "Bought elsewhere.", staff: "Sara", createdAt: daysAgo(8) },
    ],
  });
}
