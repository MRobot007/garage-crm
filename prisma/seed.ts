import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../lib/seed-core";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Garage CRM…");
  await seedDatabase(prisma);
  console.log("✅ Seed complete: 5 cars, 10 accessories, 3 customers, 3 invoices, 6 leads.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
