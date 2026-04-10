# TCL customer portal

Next.js customer portal for orders, proofs, and Supabase Auth.

## Demo sign-in (local seed)

After you run a fresh database reset with the included seed (see below), use:

| Field    | Value              |
| -------- | ------------------ |
| Email    | `test@tcl-demo.com` |
| Password | `Test@123`          |

Use only on non-production environments. Change or remove this user before going live.

---

## Prerequisites

1. **Node.js** 20+ (LTS recommended)
2. **npm** (ships with Node)
3. **Docker Desktop** (required for Supabase local stack: Postgres, Auth, Storage API)
4. **Supabase CLI** — run via `npx supabase` (no global install required)

---

## Step-by-step: run locally

### 1. Clone and enter the project root

```bash
git clone <repository-url>
cd <repository-directory>
```

All `npm` and `npx` commands below are run from the **repository root** (same folder as `package.json`).

### 2. Install dependencies

```bash
npm install
```

### 3. Start Supabase (Docker must be running)

From the **repository root**:

```bash
npx supabase start
```

Note the printed **API URL**, **anon key**, and **service role** key (Studio URL is optional).

### 4. Apply schema and seed (fresh local DB)

From the **repository root**, reset the database (runs migrations in `supabase/migrations/` plus `seed.sql` and `seed-proofs-demo.sql`):

```bash
npx supabase db reset
```

This creates:

- Full **public** schema, **RLS**, triggers (including “all proofs approved → order approved”), and storage policy for uploads
- Demo Auth user **`test@tcl-demo.com`** / **`Test@123`**
- Sample **products**, one **order** for that user, and **demo proofs** (placeholder images)

### 5. Environment variables

```bash
copy .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

Edit **`.env.local`** and set:

| Variable | Where to get it |
| -------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | `npx supabase status` → API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `npx supabase status` → anon **public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | `npx supabase status` → **service_role** key (server-only; never expose to the browser) |
| `NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET` | Keep default `product_image` unless you renamed the bucket |
| `GOOGLE_API_KEY` | Optional — enables Gemini “what happens next” (Bonus 2). Omit to use the static fallback. |

Never commit `.env.local`. Never prefix the service role or `GOOGLE_API_KEY` with `NEXT_PUBLIC_`.

### 6. Run the Next.js app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to **`/login`**. Sign in with the demo credentials above.

### 7. Production build check (optional)

```bash
npm run build
npm start
```

---

## Fresh setup on hosted Supabase

1. Create a Supabase project.
2. Apply database migrations: either link this repo and run **`npx supabase db push`**, or in **SQL Editor** run each file under **`supabase/migrations/`** in **filename (timestamp) order**, starting with **`20260110120000_initial_schema.sql`** for a new database.
3. In **Authentication → Providers**, enable **Email** if needed.
4. Create a user (e.g. **Sign up** from the app, or invite via dashboard), then add **products** (or use **SQL** / **Table Editor**). The app expects `public.users` rows linked to `auth.users` (the migration trigger `handle_new_user` does this on new sign-ups).
5. Optionally run **`supabase/seed-proofs-demo.sql`** in the SQL Editor to attach demo proofs to an order that has none (see comments in that file).
6. Create a **public** storage bucket named **`product_image`** (or set `NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET` to match your bucket) with policies appropriate for your security model.
7. Copy **Project URL**, **anon**, and **service_role** keys into **`.env.local`** on your host (e.g. Vercel env vars).

---

## Project layout

| Path | Purpose |
| ---- | ------- |
| Root | Next.js app: `package.json`, `middleware.ts`, `app/`, `components/`, etc. |
| `supabase/migrations/` | SQL migrations (schema, triggers, seeds applied via `db reset` / `db push`) |
| `supabase/seed.sql` | Demo user, products, sample order |
| `supabase/seed-proofs-demo.sql` | Optional demo proof rows (runs after seed on `db reset`) |
| `.env.example` | Template for `NEXT_PUBLIC_*` and server keys |
| `AGENTS.md` / `CLAUDE.md` | Cursor / agent notes |

---

## Useful npm scripts (from the repository root)

| Script | Command |
| ------ | ------- |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Bubble sample migration (Bonus 3) | `npm run bubble:migrate` |
| Gemini migration notes (Bonus 4) | `npm run migration:agent` |

---

## How to check the bonus deliverables (2–4)

Run everything from the **repository root** with the app and Supabase working as in the steps above.

### Bonus 2 — Gemini “what happens next”

**What it is:** After placing an order (or on an order’s detail page), the UI calls **`GET /api/orders/[id]/next-best-action`**, which uses **Google Gemini** when `GOOGLE_API_KEY` is set.

**How to verify**

1. Add **`GOOGLE_API_KEY`** to **`.env.local`** and restart **`npm run dev`**.
2. Sign in as the demo user, create a **new order**, and finish the wizard. You should land on **`/dashboard?orderCreated=1`** and see the **“What happens next”** card with an AI-style message (not only the static fallback).
3. Open any **order detail** page (`/orders/[id]`). The same **“What happens next”** panel should load a tip based on **order status** and **proof counts** (e.g. different tone after proofs are approved).
4. **Without** `GOOGLE_API_KEY`: the panel should still appear with a **fallback** message explaining that the key is missing (no crash).
5. Optional API check (while logged in): open  
   `http://localhost:3000/api/orders/<order-uuid>/next-best-action`  
   in the browser. Expect **401** if not logged in, **404** if the order is not yours.

### Bonus 3 — Bubble-style JSON → Supabase script

**What it is:** **`scripts/migrate-bubble-sample.mjs`** reads **`scripts/bubble-sample-export.json`** and upserts **products**, inserts **orders** when the customer email exists, and only **updates** `public.users` when an auth user already exists for that email.

**How to verify**

1. Ensure **`.env.local`** has **`NEXT_PUBLIC_SUPABASE_URL`** and **`SUPABASE_SERVICE_ROLE_KEY`** (from `npx supabase status` locally, or your hosted project).
2. Run:
   ```bash
   npm run bubble:migrate
   ```
3. **Terminal:** You should see log lines for skipped rows (unknown emails), product upserts, and order inserts where emails match existing users.
4. **Supabase:** In **Table Editor** (or SQL), confirm **`products`** SKUs from the JSON and any new **`orders`** tied to resolvable customers.

### Bonus 4 — Multi-step Gemini “migration agent”

**What it is:** **`scripts/migration-agent.mjs`** runs three chained Gemini prompts (analyze Bubble sample → Postgres/DDL notes → RLS ideas) and writes a markdown report.

**How to verify**

1. Set **`GOOGLE_API_KEY`** in **`.env.local`**.
2. Run:
   ```bash
   npm run migration:agent
   ```
3. **Terminal:** Each step prints a short preview of the model output.
4. **Output file:** Open **`scripts/agent-pipeline-output.md`** (this path is gitignored; it is created on disk after a successful run). Skim all three sections to confirm the pipeline completed.

### Related: product sync API (often grouped with extras)

**`POST /api/sync-products`** (with **`SUPABASE_SERVICE_ROLE_KEY`** set) upserts a **mock Shopify-style** catalog into **`public.products`**. To sanity-check: call it from a REST client or script (same origin / session as your deployment rules require), then inspect the **`products`** table in Supabase.

---

## Troubleshooting

- **`npx supabase start` fails** — Start Docker Desktop; wait until it is fully running, then retry.
- **Login fails after reset** — Run `npx supabase db reset` again from the **repository root**; confirm `.env.local` matches `npx supabase status`.
- **Uploads / design files fail** — Ensure bucket **`product_image`** exists and matches `NEXT_PUBLIC_SUPABASE_DESIGNS_BUCKET`.
- **Gemini errors** — Confirm `GOOGLE_API_KEY` in `.env.local`, or leave it unset to use the built-in fallback text.

---

## Security reminders

- Rotate any API key that was ever committed or pasted into chat.
- Restrict the **service role** key to server-side code only (`/api/*`, scripts).
- Replace demo credentials before production.
