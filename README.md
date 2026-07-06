# Garage CRM

A complete CRM for a US car dealership that **sells cars and accessories**.
Manage leads, inventory, accessory stock, sales & invoices, customers and
reports — built for a small dealership (1–3 staff). Money in US Dollars ($),
sales tax 8% (configurable).

## Tech stack

- **Next.js (App Router)** + React + TypeScript
- **Tailwind CSS** — aesthetic **glassmorphism** UI (frosted panels over a gradient mesh)
- **TanStack Query** — all client data fetching, caching, optimistic updates
- **Prisma** ORM + **MySQL / MariaDB** (XAMPP compatible)
- **Zod** — validation on client and server
- **Anime.js** — subtle micro-interactions (count-up, modal, toast, list stagger)
- **Three.js** (react-three-fiber + drei) — one lazy-loaded 3D car on the car detail page
- **Deploy target:** Vercel

## Features

| Module | What it does |
|--------|--------------|
| **Dashboard** | Animated summary cards, sales funnel, today's follow-ups, low-stock list |
| **Leads** | Pipeline table with optimistic status changes, filters, "Convert to Sale" |
| **Cars** | Inventory with margin & days-in-stock, filters, 3D detail page |
| **Accessories** | Stock table with +/- adjust, low-stock highlighting |
| **Sales & Invoices** | Invoice builder (1 car + N accessories), GST, payments, printable view |
| **Customers** | Auto-built from leads & invoices; purchase history |
| **Reports** | Revenue split, sales by staff, lead conversion, dead stock |
| **Settings** | Business name, currency, sales tax %, reset demo data |
| **Auth** | Whole app behind a shared-password login (except the public lead intake) |

### Website lead capture

The public marketing site's enquiry form POSTs to `POST /api/leads` (CORS-enabled,
no login required) — each enquiry becomes a **lead** (source = *Website*) plus an
auto-created **customer**. Every other route requires logging in. See
**[DEPLOY.md](DEPLOY.md)** to take the CRM live and wire it to the website.

### The pipeline (end to end)

Lead added → moved through the pipeline → on **Won**, "Convert to Sale" opens a
prefilled invoice → pick the car + accessories → on save a **single Prisma
transaction** marks the car **Sold**, decrements accessory stock, upserts the
customer, and creates the invoice + line items → the dashboard, reports and
pending-payments totals all update via TanStack Query invalidation.

## Project structure

```
app/            routes, pages, and /api route handlers (REST)
components/
  ui/           the plain kit (Button, Card, Input, Table, Modal, Badge, Toast…)
  layout/       Sidebar, Topbar, AppShell, global search
  <feature>/    dashboard, leads, cars, accessories, invoices, customers, reports, settings
hooks/          TanStack Query hooks per entity + animation hooks
lib/            prisma client, query client, zod schemas, fetchers, calc, utils
prisma/         schema.prisma + seed.ts
```

## Local setup (XAMPP / MySQL)

**Prerequisites:** Node 18+ and MySQL. On XAMPP, open the **Control Panel** and
click **Start** next to **MySQL**.

```bash
# 1) Install dependencies (runs `prisma generate` automatically)
npm install

# 2) Configure env
cp .env.example .env
#    DATABASE_URL — defaults to XAMPP: mysql://root:@127.0.0.1:3306/garage_crm
#    CRM_PASSWORD — the login password you'll use to open the CRM
#    AUTH_SECRET  — any long random string (signs the login cookie)

# 3) Create the tables (Prisma creates the `garage_crm` database if missing)
npm run db:push

# 4) Load demo data (6 leads, 5 cars, 10 accessories, 3 customers, 3 invoices)
npm run db:seed

# 5) Run it
npm run dev
# open http://localhost:3000 → log in with CRM_PASSWORD
```

> You can also create the `garage_crm` database yourself in **phpMyAdmin**
> (http://localhost/phpmyadmin) before running `db:push`. Use collation
> `utf8mb4_unicode_ci`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Start the production server |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Force-reset the schema and reseed |

## Authentication

The entire app sits behind a shared-password login (`CRM_PASSWORD`), enforced by
`middleware.ts` via an HMAC-signed, 7-day session cookie (`AUTH_SECRET`). The one
exception is `POST /api/leads`, left public so the marketing website can submit
enquiries. Log out with the icon in the top bar.

## Deploy

XAMPP's MySQL is local-only, so a public deploy needs a hosted MySQL database and
three env vars: `DATABASE_URL`, `CRM_PASSWORD`, `AUTH_SECRET`.

**→ Full step-by-step walkthrough (hosting, DB, and wiring the live website): see
[DEPLOY.md](DEPLOY.md).**

## Design notes

- **Glassmorphism.** Frosted translucent panels (`backdrop-blur` + subtle white
  borders) float over a fixed, colorful gradient mesh. One accent blue
  (`#2563eb`), restrained status colors (green = paid/available, amber =
  pending, red = lost/out-of-stock), system font stack. Glass flattens to plain
  white paper when printing an invoice.
- **Motion is subtle.** Anime.js only for count-up, modal fade/scale, toast
  slide-in and a light list stagger — all disabled under
  `prefers-reduced-motion`.
- **One 3D element.** A lightweight low-poly car (built from primitives, no
  external asset) on the car detail page, lazy-loaded via `next/dynamic`
  (`ssr: false`) so it never blocks the rest of the app.
- **Accessible.** Real buttons, labeled inputs, visible focus rings, keyboard
  Escape to close modals, horizontally scrollable tables on mobile.
