# Deploying the Garage CRM (and wiring the live website)

Your marketing site is already live at **vozidex.vercel.app**. It can only push
leads into the CRM once the CRM is **also** deployed to a public HTTPS URL with a
**hosted** database (XAMPP MySQL is local-only). This guide does that end to end.

---

## Step 1 — Create a hosted MySQL database

Pick any MySQL host (all have free/cheap tiers):

- **Railway** — https://railway.app → New → Database → MySQL
- **Aiven** — https://aiven.io → MySQL (free plan)
- **TiDB Cloud** — https://tidbcloud.com (MySQL-compatible, free Serverless tier)
- **PlanetScale** — https://planetscale.com

Copy the connection string. Convert it to Prisma's format:

```
mysql://USER:PASSWORD@HOST:PORT/garage_crm?sslaccept=strict
```

(Most hosted MySQL requires TLS — keep `?sslaccept=strict`. Railway usually gives
you a ready-to-use `mysql://...` URL.)

## Step 2 — Push the CRM to GitHub

From `d:\car bussiness\crm`:

```bash
git init
git add .
git commit -m "Garage CRM"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/garage-crm.git
git push -u origin main
```

`.env` is git-ignored, so your local secrets are not pushed. Good.

## Step 3 — Import into Vercel and set env vars

1. https://vercel.com → **Add New → Project** → import the repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default —
   `npm run build` already runs `prisma generate`.
3. Under **Environment Variables**, add all three:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your hosted MySQL string from Step 1 |
   | `CRM_PASSWORD` | the password staff will type to log in |
   | `AUTH_SECRET` | a long random string (see below) |

   Generate `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy.** Note the resulting URL, e.g. `https://garage-crm.vercel.app`.

## Step 4 — Create the tables and seed (once)

The build doesn't touch the database, so create the schema once. From your PC,
pointed at the **production** DB:

```bash
# temporarily use the prod DB URL
DATABASE_URL="mysql://...prod..." npx prisma db push
DATABASE_URL="mysql://...prod..." npx tsx prisma/seed.ts   # optional demo data
```

(Windows PowerShell: `$env:DATABASE_URL="mysql://...prod..."; npx prisma db push`)

Then open `https://garage-crm.vercel.app`, log in with `CRM_PASSWORD`, and you're in.

## Step 5 — Wire the live website to the CRM

In the website repo, edit `index.html` → the `CONFIG` block:

```js
crmEndpoint: "https://garage-crm.vercel.app/api/leads"   // your CRM URL + /api/leads
```

Commit and redeploy the website (push to its Vercel project). Done.

## Step 6 — Test it end to end

1. Open **vozidex.vercel.app**, submit the enquiry form.
2. Open **garage-crm.vercel.app**, log in, go to **Leads** — the enquiry appears
   with **source = Website**, and a matching **Customer** is auto-created.

---

## Notes

- **Login:** the whole CRM is behind `CRM_PASSWORD`. Only `POST /api/leads` (the
  website's lead intake) is public — everything else redirects to `/login`.
  Change the password anytime by updating the `CRM_PASSWORD` env var in Vercel
  and redeploying.
- **CORS is already configured** — `/api/leads` allows cross-origin POSTs, so the
  website can reach it from its own domain.
- **Sessions** last 7 days, then staff log in again. Use the log-out icon in the
  top bar to end a session early.
- **Changing demo → real data:** delete the seeded rows in the app, or skip the
  seed in Step 4 and add your real stock/leads from scratch.
- **Rotating `AUTH_SECRET`** logs everyone out (existing cookies stop verifying).
