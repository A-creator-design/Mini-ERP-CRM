# OpsDesk — Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for a wholesale/distribution business, covering customers,
products, stock, and sales challans, with role-based access for Admin, Sales, Warehouse,
and Accounts teams.

**Live demo credentials** (see [Test Logins](#test-logins) below — all share the password `Password@123`).

---

## 1. Architecture

```
erp-crm/
├── backend/     Node.js + TypeScript + Express + PostgreSQL (Prisma ORM)
├── frontend/    React + TypeScript + Vite + Tailwind CSS
├── docker-compose.yml
└── postman_collection.json
```

**Backend** is organized module-first (not just MVC-by-folder-type), so each business
domain owns its full stack:

```
backend/src/
├── config/          env loading, shared Prisma client
├── middleware/       JWT auth, RBAC guard, Zod validation, global error handler
├── modules/
│   ├── auth/          login, employee registration, /me
│   ├── customers/      CRM: list/search, detail, notes, status
│   ├── products/       catalog + stock movement ledger
│   ├── challans/       sales challans, draft/confirm/cancel state machine, PDF export
│   └── dashboard/      aggregate stats for the landing page
└── utils/             ApiError, asyncHandler, challan numbering, PDF generator
```

Each module follows **routes → controller → service** — routes wire up middleware and
validation, controllers translate HTTP <-> domain calls, services hold business logic and
are the only layer that talks to Prisma. This keeps stock-deduction rules, challan
numbering, and RBAC testable independently of Express.

**Frontend** mirrors the same domains under `src/pages/`, with a shared `src/api/` layer
(one file per resource, all requests go through an Axios instance that injects the JWT and
handles 401s), a `AuthContext` for the current user/role, and reusable UI in
`src/components/` (Layout/sidebar, modals, status badges, empty states).

### Key business logic

- **Stock never goes negative.** Both direct stock movements (`POST
  /products/:id/stock-movements`) and challan confirmation run inside a Prisma
  `$transaction`: current stock is read, the resulting balance is checked, and if it would
  go below zero the whole operation is rejected with a `400` before anything is written.
- **Challans store a product snapshot** (name, SKU, unit price) at the time each line item
  is added, so historical challans stay accurate even if a product's price or name changes
  later — only `productId` is a live foreign key.
- **Draft → Confirmed → Cancelled is a guarded state machine**, implemented in
  `challans.service.ts`: confirming a draft deducts stock (or fails cleanly if stock is
  short); cancelling a confirmed challan restores stock; a cancelled challan can't
  transition further.
- **RBAC** is enforced with an `authorize(...roles)` middleware on each route — e.g. only
  `ADMIN`/`WAREHOUSE` can add products or record stock movements; only `ADMIN`/`SALES` can
  create customers and challans; everyone with a valid token can read.

---

## 2. Tech Stack

| Layer       | Choice                                                             |
|-------------|---------------------------------------------------------------------|
| Backend     | Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL             |
| Auth        | JWT (jsonwebtoken) + bcrypt password hashing                        |
| Validation  | Zod schemas on every mutating route                                 |
| Frontend    | React 18, TypeScript, Vite, React Router, Tailwind CSS, Axios       |
| Bonus       | PDF invoice export (pdfkit), Docker/Docker Compose                  |

---

## 3. Core Modules (mapped to the spec)

1. **Auth & Roles** — JWT login, `Admin` can provision new employee accounts for any role.
2. **Customer CRM** — add/edit/search customers, detail page with follow-up notes and
   recent challans, Lead/Active/Inactive status, customer type (Retail/Wholesale/Distributor).
3. **Product & Inventory** — catalog with SKU/category/price/stock/min-alert/location, a
   full stock movement ledger (IN/OUT with reason + actor), low-stock filter and dashboard
   alerts.
4. **Sales Challans** — pick a customer, add multiple products with quantity, auto-generated
   challan number (`CH-2026-0001`, sequential per year), Draft/Confirmed/Cancelled workflow,
   product snapshots, and a downloadable PDF.

---

## 4. Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (local install, or use the provided `docker-compose.yml` for just the DB)
- npm

### 4.1 Database
Option A — Docker (recommended, DB only):
```bash
docker compose up -d db
```
Option B — local Postgres: create a database named `erp_crm`.

### 4.2 Backend
```bash
cd backend
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET if needed
npm install
npm run prisma:migrate    # creates tables
npm run prisma:seed       # creates demo users, customers, products
npm run dev                # http://localhost:4000
```

### 4.3 Frontend
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

Open `http://localhost:5173` and sign in with one of the demo accounts below.

---

## 5. Environment Variables

**backend/.env**
```
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_crm
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000/api
```

Never commit `.env` files — both are already git-ignored; only `.env.example` is checked in.

---

## 6. Test Logins

Seeded by `npm run prisma:seed` — all use password `Password@123`:

| Role      | Email               |
|-----------|----------------------|
| Admin     | admin@erp.com         |
| Sales     | sales@erp.com         |
| Warehouse | warehouse@erp.com     |
| Accounts  | accounts@erp.com      |

---

## 7. API Overview

All endpoints are prefixed with `/api`. Full request/response examples are in
[`postman_collection.json`](./postman_collection.json) — import it into Postman and set the
`baseUrl` and `token` collection variables.

| Method | Endpoint                             | Roles                          |
|--------|----------------------------------------|----------------------------------|
| POST   | `/auth/login`                          | Public                          |
| POST   | `/auth/register`                       | Admin                           |
| GET    | `/auth/me`                             | Any authenticated user          |
| GET    | `/customers`                           | Any (search, status, pagination)|
| POST   | `/customers`                           | Admin, Sales                    |
| PUT    | `/customers/:id`                       | Admin, Sales                    |
| POST   | `/customers/:id/notes`                 | Admin, Sales                    |
| GET    | `/products`                            | Any (search, lowStock, pagination)|
| POST   | `/products`                            | Admin, Warehouse                |
| PUT    | `/products/:id`                        | Admin, Warehouse                |
| POST   | `/products/:id/stock-movements`        | Admin, Warehouse                |
| GET    | `/challans`                            | Any                              |
| POST   | `/challans`                            | Admin, Sales                    |
| PATCH  | `/challans/:id/status`                 | Admin, Sales, Warehouse          |
| GET    | `/challans/:id/pdf`                    | Any                              |
| GET    | `/dashboard/summary`                   | Any                              |

Every response uses a consistent envelope: `{ success, data, meta? }` on success, and
`{ success: false, message, details? }` on error, with proper HTTP status codes (400
validation, 401 auth, 403 role, 404 not found, 409 conflict).

---

## 8. Deployment

**Recommended free-tier stack:**
- Frontend → Vercel or Netlify (`npm run build`, output `frontend/dist`)
- Backend → Render or Railway (`npm run build && npm start`, run `npx prisma migrate deploy`
  once on first deploy)
- Database → Neon, Supabase, or Render Postgres (copy the connection string into
  `DATABASE_URL`)

**Docker (bonus):**
```bash
docker compose up -d db        # start Postgres
cd backend && docker build -t erp-backend .
docker run --env-file .env -p 4000:4000 erp-backend
```
The backend `Dockerfile` runs `prisma migrate deploy` automatically on container start.

Set `CORS_ORIGIN` on the backend to your deployed frontend URL, and `VITE_API_URL` on the
frontend to your deployed backend `/api` URL, then rebuild the frontend.

---

## 9. Assumptions

- Currency is displayed as ₹ (INR) for a wholesale/distribution business context; this is a
  display-only assumption and not enforced anywhere.
- "Accounts" role is read-only across all modules in this build — the spec didn't define a
  distinct accounts-only action, so they can view customers/products/challans but not
  mutate them, pending a real requirement (e.g. payments/invoicing) from the business.
  Extending them to manage invoices/payments in the future only touches
  `authorize()` calls per route.
- Challan numbers reset their sequence each calendar year (`CH-2026-0001`, `CH-2027-0001`, …).
- A customer's `email` and `gstNumber` are optional per the spec table.
- Deleting customers/products isn't in the required feature list, so it's intentionally left
  out — records are only ever edited or their status changed, keeping the audit trail
  (challans, stock movements) intact.

---

## 10. Known Limitations / Not Yet Implemented

- No automated test suite (unit/integration tests) — given the 48-hour scope, testing was
  deprioritized in favor of complete, correct feature coverage. Zod schemas + transactional
  Prisma logic keep the highest-risk paths (stock math) safe by construction.
- No pagination UI controls on the frontend yet (API supports `page`/`limit`; tables
  currently just request a larger page size).
- Product image upload to S3 (listed as a bonus) is not implemented.
- GitHub Actions CI/CD pipeline is not included.
- No password reset / forgot-password flow — admin re-provisions accounts via
  `POST /auth/register` instead.

---

## 11. Bonus Features Implemented

- ✅ **PDF invoice export** — `GET /challans/:id/pdf` streams a formatted PDF via `pdfkit`,
  with a "Download PDF" button on the challan detail page.
- ✅ **Docker** — `backend/Dockerfile` + root `docker-compose.yml` for one-command local Postgres
  and a production-style backend image.
