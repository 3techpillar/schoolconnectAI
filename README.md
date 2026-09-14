# SchoolConnect AI

WhatsApp-first school communication for **web** and **React Native**, sharing one Next.js `/api` backend and `@schoolconnect/shared`.

> **Monorepo:** `apps/web` · `apps/mobile` · `packages/shared`  
> **Auth:** JWT — web cookie `sc_session`; mobile `Authorization: Bearer`  
> **Product:** per-school **Connect** or **Full ERP** → [docs/PRODUCT-MODES.md](docs/PRODUCT-MODES.md)

**Documentation hub:** **[docs/README.md](docs/README.md)**  
**Routes & UI/UX Re-design Guide:** **[docs/ROUTES_AND_UI_UX_GUIDE.md](docs/ROUTES_AND_UI_UX_GUIDE.md)** — all 38 pages, features, links, theming  
**Business requirements (full):** **[docs/BRD.md](docs/BRD.md)** — features, flows, diagrams, use cases, FAQs  
**System architecture:** **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — monorepo, providers, `/api` layers, `/api/v1`  
**Product modes:** [docs/PRODUCT-MODES.md](docs/PRODUCT-MODES.md) · **CSV import/export:** [docs/DATA-IMPORT-EXPORT.md](docs/DATA-IMPORT-EXPORT.md)

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure) *(→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md))*
4. [Requirements](#requirements)
5. [Environments](#environments)
6. [Local development](#local-development)
7. [MongoDB setup & seed](#mongodb-setup--seed)
8. [Demo accounts](#demo-accounts)
9. [Staging](#staging)
10. [Production](#production)
11. [Deployment](#deployment)
12. [Important instructions](#important-instructions)
13. [Scripts reference](#scripts-reference)
14. [Documentation](#documentation)

---

## Features

### Product modes

| Mode | Who | What |
|------|-----|------|
| **Connect** | Collab-only | Chats, HW, bus, leave, light `/admin`, `/transfers` |
| **Full ERP** | MDM schools | Connect **plus** `/erp` |

| Campus | Connect | ERP |
|--------|---------|-----|
| **Single** | Harmony | Radoms International |
| **Group** | Sunrise East/West | Radmos Noida/Lucknow |

Free plan **~1 year** per school (`subscriptionExpiresAt`). Details: **[docs/PRODUCT-MODES.md](docs/PRODUCT-MODES.md)** · **[docs/BRD.md](docs/BRD.md)**.

### App surfaces

| Area | What it does |
|------|----------------|
| **Auth** | Phone or email → OTP → profile. Teachers need admin invite code |
| **Enrollment** | Invites + student approval on `/pending` |
| **Home** | Role-aware dashboards (family / teacher / admin) |
| **School Admin** | Users, promotions, sessions (`/admin`) |
| **School ERP** | Desktop MDM when `productMode === "erp"` — shared DB/API with web & mobile |
| **CSV import/export** | Students & teachers/staff bulk load (`/erp/students`, `/erp/staff`) — [guidelines](docs/DATA-IMPORT-EXPORT.md) |
| **Campus transfers** | Group or open-intake moves (`/transfers`, `/erp/transfers`) |
| **Super Admin** | Multi-school + product mode + subscription end date + all admin tools |
| **Teacher Class Desk** | Roster, attendance P/A/L/H, daily activity, parent DMs |
| **Learning Zone** | XP, streaks, missions (`/engage`) — parent & student |
| **Chats / Homework / Circulars / Notifications** | WhatsApp-style school communication |
| **Attendance / Leaves** | Calendar; approved leaves as **L** |
| **Fees** | Family pay UI when fees module on (ERP schools by default) |
| **Bus tracking** | Live ETA + 10 / 5 min alerts |
| **AI assistant** | In-app school Q&A (rule stub) |

**Roles:** Parent, Student, Class Teacher, Bus Attendant, Principal, School Admin, Super Admin, Accountant.  
**Family:** Parent ≈ student nav; Fees tab only if school capabilities allow. Matrix: **[docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md)**.

### Admin vs Super Admin

| Capability | School Admin | Super Admin |
|------------|--------------|-------------|
| School user directory | Own school | All schools |
| Change user roles | Yes (not Super Admin) | Yes (including Super Admin) |
| Annual class promotion | Yes | Yes |
| Complete / start academic session | Yes | Yes |
| Activate / pause schools | No | Yes |
| Set school `productMode` | No | Yes |
| Open `/erp` | If school is ERP mode | Always (onboarding) |

---

## Tech stack

- **Monorepo** (npm workspaces): `apps/web`, `apps/mobile`, `packages/shared`
- **Next.js 15** (App Router) + **React 19** + **TypeScript** (web + API)
- **React Native 0.76 CLI** (Family MVP mobile)
- **MongoDB** via **Mongoose**
- **JWT** (`jose`) — cookie `sc_session` (web) + Bearer (mobile)
- **Plain CSS** (`apps/web/src/app/globals.css`)
- Shared domain: `@schoolconnect/shared`

---

## Project structure

```text
apps/
  web/                    # Next.js UI + /api/* backend
    src/app/              # Pages + API routes (+ /erp, /api/v1)
    src/components/       # shell/ · admin/ · erp/
    src/lib/
      models/             # core · comms · ops · family · erp
      server/             # http/auth + services/
      providers/ shared/ db/
    src/modules/          # Domain modules for /api/v1
    src/shared/           # v1 RBAC + tenant
    src/STRUCTURE.md      # Folder roles cheat-sheet
    config/api-proxy.ts   # Local-dev API rewrite only
  mobile/                 # React Native CLI Family MVP
packages/
  shared/                 # @schoolconnect/shared — roles, product modes, DTOs, Zod
docs/                     # See docs/README.md
deploy/                   # Dockerfile + compose (context = repo root)
```

Web imports (`@/*` → `apps/web/src/*`). Prefer domain types from `@schoolconnect/shared`.

Deep dive: **[docs/README.md](docs/README.md)** · Architecture: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Structure: **[apps/web/src/STRUCTURE.md](apps/web/src/STRUCTURE.md)** · Mobile: **[docs/MOBILE.md](docs/MOBILE.md)**.

---

## Requirements

- **Node.js 20.19+ or 22.12+** (recommended: **22 LTS**)
- npm
- MongoDB Atlas (or local Mongo) when using the API backend

```bash
nvm use 22   # if you use nvm
node -v
npm -v
```

---

## Environments

| Env | Purpose | Typical URL |
|-----|---------|-------------|
| **development** | Local | `http://localhost:3000` |
| **staging** | QA | staging domain / port 3001 |
| **production** | Live | production HTTPS URL |

### Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `MONGO_URI` or `MONGODB_URI` | **Server only** | Mongo connection string. Either name works. |
| `JWT_SECRET` | **Server only** | Signing key for session cookies |
| `OTP_PROVIDER` | Server | `demo` (default) — fixed OTP; real SMS later |
| `OTP_DEMO_CODE` | Server | Optional override for demo OTP (default `000000`) |
| `NEXT_PUBLIC_DEMO_OTP` | Client | OTP shown/accepted in UI (default `000000`) |
| `NEXT_PUBLIC_DEMO_MODE` | Client | Demo UX hints |
| `NEXT_PUBLIC_APP_NAME` | Client | Display name |
| `NEXT_PUBLIC_APP_URL` | Client | Public base URL |
| `APP_ENV` / `NEXT_PUBLIC_APP_ENV` | Both | `development` / `staging` / `production` |

> Never put Mongo URI, JWT, or real OTP secrets in `NEXT_PUBLIC_*`.

```bash
cp .env.example .env.local
# or keep secrets in .env (gitignored if you add it — prefer .env.local)
```

---

## Local development

### Without Mongo (UI / localStorage fallback)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — auth/data stay in the browser.

### With Mongo (recommended — full API mode)

1. Set in `.env` or `.env.local`:

```bash
MONGO_URI=mongodb+srv://USER:PASS@CLUSTER/DB?retryWrites=true&w=majority
JWT_SECRET=long-random-secret
OTP_PROVIDER=demo
NEXT_PUBLIC_DEMO_OTP=000000
```

2. Allow your IP in **Atlas → Network Access** (or temporarily `0.0.0.0/0` for local demo).
3. Seed + run:

```bash
npm install
# env for web/API (preferred path after monorepo move)
cp .env.example apps/web/.env.local   # or keep root .env and copy into apps/web/
npm run seed
npm run dev:web
```

Mobile (separate terminal): see **[docs/MOBILE.md](docs/MOBILE.md)**.

4. Check health: http://localhost:3000/api/health → should include `"mongo": true`.

If Mongo is down / IP blocked, `/api/health` reports degraded and the UI falls back to localStorage.

---

## MongoDB setup & seed

### Atlas checklist

1. Create a cluster and database user.
2. **Network Access** → add your current IP (seed hangs or times out if IP is blocked).
3. Copy the connection string into `MONGO_URI` or `MONGODB_URI`.
4. Run:

```bash
npm run seed
```

Successful seed prints all demo emails for the **full matrix**:

- Single + ERP / Group + ERP / Single + Connect / Group + Connect  
- Pending transfers (group + cross-group)  
- Free ~1 year subscription per school  

See [Demo accounts](#demo-accounts) for credential tables.

Seed is **idempotent** (safe to re-run). It also bootstraps demo chats, homework, notifications, and class desk per school.

### Common seed / connect errors

| Symptom | Cause | Fix |
|---------|--------|-----|
| Hangs, then IP whitelist error | Atlas Network Access | Add current IP or `0.0.0.0/0` |
| `MONGO_URI is not set` | Env not loaded | Put URI in `.env` / `.env.local` |
| `mongo: false` on `/api/health` | Next can’t see env | Restart `npm run dev` after editing env |

---

## Demo accounts

After `npm run seed`, sign in on `/auth`. **OTP:** `000000`.

Every school gets a **free subscription for ~1 year** (`subscriptionExpiresAt`). Super Admin can extend/change the end date on `/erp/schools`.

### Product matrix (all seeded)

| | **Connect** (no MDM) | **Full ERP** |
|--|----------------------|--------------|
| **Single campus** | Harmony Connect | Radoms International *(open cross-group intake)* |
| **Group (multi-campus)** | Sunrise East + West (`SUNRISE`) | Radmos Noida + Lucknow (`RADMOS`) |

**Branch overrides:** Lucknow ERP has `fees: false`; Sunrise West has `bus: false`.

**Transfers:** group = same `groupCode`; cross-group when destination `transferPolicy: open`. UI: `/transfers` (Connect) or `/erp/transfers` (ERP).

### Platform

| Identifier | Role |
|------------|------|
| `super@schoolconnect.demo` | Super Admin |

---

### A) Group + ERP — Radmos (`RADMOS`)

**Noida** (fees on)

| Identifier | Role |
|------------|------|
| `admin.noida@radmos.demo` | School Admin |
| `principal.noida@radmos.demo` | Principal |
| `teacher.noida@radmos.demo` | Class Teacher |
| `accounts.noida@radmos.demo` | Accountant |
| `bus.noida@radmos.demo` | Bus Attendant |
| `parent.noida@radmos.demo` | Parent |
| `student.noida@radmos.demo` | Student |
| `transfer.noida@radmos.demo` | Student → **pending → Lucknow** |

**Lucknow** (fees module **off**)

| Identifier | Role |
|------------|------|
| `admin.lucknow@radmos.demo` | School Admin *(approve Noida transfer)* |
| `principal.lucknow@radmos.demo` | Principal |
| `teacher.lucknow@radmos.demo` | Class Teacher |
| `accounts.lucknow@radmos.demo` | Accountant |
| `bus.lucknow@radmos.demo` | Bus Attendant |
| `parent.lucknow@radmos.demo` | Parent |
| `student.lucknow@radmos.demo` | Student |

---

### B) Single + ERP — Radoms International (`open` intake)

| Identifier | Role |
|------------|------|
| `admin@radoms.demo` | School Admin *(approve cross-group)* |
| `principal@radoms.demo` | Principal |
| `teacher@radoms.demo` | Class Teacher |
| `accounts@radoms.demo` | Accountant |
| `bus@radoms.demo` | Bus Attendant |
| `parent@radoms.demo` | Parent |
| `student@radoms.demo` | Student |

---

### C) Single + Connect — Harmony

| Identifier | Role |
|------------|------|
| `admin@connect.demo` | School Admin → `/transfers` |
| `principal@connect.demo` | Principal |
| `teacher@connect.demo` | Class Teacher |
| `bus@connect.demo` | Bus Attendant |
| `parent@connect.demo` | Parent |
| `student@connect.demo` | Student |
| `cross.harmony@connect.demo` | Student → **pending cross-group → RIS** |

---

### D) Group + Connect — Sunrise (`SUNRISE`)

**East**

| Identifier | Role |
|------------|------|
| `admin.east@sunrise.demo` | School Admin |
| `teacher.east@sunrise.demo` | Class Teacher |
| `parent.east@sunrise.demo` | Parent |
| `student.east@sunrise.demo` | Student |
| `transfer.east@sunrise.demo` | Student → **pending → West** |

Also: `principal.east@sunrise.demo`, `bus.east@sunrise.demo`

**West** (bus module **off**)

| Identifier | Role |
|------------|------|
| `admin.west@sunrise.demo` | School Admin *(approve East transfer)* |
| `teacher.west@sunrise.demo` | Class Teacher |
| `parent.west@sunrise.demo` | Parent |
| `student.west@sunrise.demo` | Student |

Also: `principal.west@sunrise.demo`, `bus.west@sunrise.demo`

---

### Legacy Green Valley (ERP)

`admin@greenvalley.demo` · `teacher@greenvalley.demo` · `accounts@greenvalley.demo` · `parent@demo.com` · `student@demo.com`

Session cookie: `sc_session` (httpOnly).

---

## Staging

```bash
npm ci
npm run build:staging
npm run start:staging   # port 3001
```

On Vercel Preview, set the same public vars plus **server** secrets:

```text
MONGO_URI=...
JWT_SECRET=...
OTP_PROVIDER=demo
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_DEMO_OTP=000000
```

---

## Production

```bash
npm ci
npm run build:production
npm run start:production
```

### Production checklist

- [ ] Real `MONGO_URI` + strong `JWT_SECRET`
- [ ] Atlas Network Access locked to known IPs / VPC (not open `0.0.0.0/0` long-term)
- [ ] `NEXT_PUBLIC_APP_URL` = real HTTPS domain
- [ ] `OTP_PROVIDER=demo` only for demos — replace before real users
- [ ] Smoke: `/api/health`, `/auth`, `/admin`, `/chats`, `/bus`
- [ ] Do **not** force-push / rewrite published git history (Lovable sync)

---

## Deployment

### Vercel

Set **Preview** and **Production** env vars separately (`MONGO_URI`, `JWT_SECRET`, public `NEXT_PUBLIC_*`).

```bash
vercel
vercel --prod
```

### Docker — local

Image: `deploy/Dockerfile` (build context = repo root).

```bash
npm run docker:build
npm run docker:run   # uses --env-file .env
```

### Docker — कस्टम सर्वर (VPS)

सर्वर पर Docker + Compose चाहिए। Mongo Atlas में **server IP allowlist** करें। विस्तार: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

**1. Code लाएँ**

```bash
git clone <your-repo-url> schoolconnect
cd schoolconnect
```

**2. Env सेट करें** (रूट `.env`)

```bash
cp .env.example .env
nano .env
```

| Key | क्या भरें |
|-----|-----------|
| `MONGO_URI` / `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | लंबा random secret |
| `NEXT_PUBLIC_APP_URL` | `https://your.domain` (build-time; बदलो तो rebuild) |
| `OTP_PROVIDER` | असली यूज़र्स के लिए `demo` मत रखो |

**3. Build & run**

```bash
docker compose -f deploy/compose.yml up -d --build
# या: npm run docker:up

curl -s http://127.0.0.1:3000/api/health
# expect: "mongo": true
```

**4. Seed एक बार** (Mongo पहुँच वाली मशीन से)

```bash
npm ci
npm run seed
```

**5. HTTPS (डोमेन)** — Nginx/Caddy → `127.0.0.1:3000`

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

**अपडेट**

```bash
git pull
docker compose -f deploy/compose.yml up -d --build
```

`MONGO_URI` / `JWT_SECRET` runtime पर दें (`--env-file` / Compose)। `NEXT_PUBLIC_*` image build में bake होते हैं।

`public/robots.txt` सिर्फ crawler hint है — सर्वर सुरक्षा नहीं।

### Node host / PM2

```bash
npm ci
npm run build:production
npm run start:production
```

---

## Important instructions

1. **Node 22** (or 20.19+) recommended.
2. **Mongo first for API mode** — seed before expecting shared data across browsers/devices.
3. **No secrets in `NEXT_PUBLIC_*`.**
4. Fees “Pay now” and AI replies are still **demo simulations**; fee ledger + bus route geometry load from Mongo via `/api/fees` and `/api/bus` when the backend is up.
5. **Git / Lovable** — do not force-push or rewrite remote history.
6. Prefer `npm ci` on servers.
7. Protected routes redirect to `/auth` (optional `?redirect=/fees`).
8. Smoke routes: `/`, `/auth`, `/admin`, `/erp`, `/engage`, `/class`, `/chats`, `/homework`, `/attendance`, `/fees`, `/circulars`, `/bus`, `/ai`, `/api/health`.
9. Teachers need an **invite code** from School Admin; students may stay on `/pending` until enrollment is approved.
10. Full docs index: **[docs/README.md](docs/README.md)**. Business requirements: **[docs/BRD.md](docs/BRD.md)**. API map: **[docs/BACKEND.md](docs/BACKEND.md)**.

---

## Documentation

Everything under **`docs/`** is indexed here: **[docs/README.md](docs/README.md)**.

| Doc | Contents |
|-----|----------|
| [docs/BRD.md](docs/BRD.md) | **Full BRD** — features, flowcharts, use cases, FAQs (**v1.2**) |
| [docs/PRODUCT-MODES.md](docs/PRODUCT-MODES.md) | Campus × mode matrix, transfers, free subscription |
| [docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md) | Per-role UI / API |
| [docs/ERP.md](docs/ERP.md) | Desktop `/erp` MDM + school flags |
| [docs/DATA-IMPORT-EXPORT.md](docs/DATA-IMPORT-EXPORT.md) | Student & teacher CSV import/export guidelines |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | **System architecture** — monorepo, providers, modular `/api/v1` |
| [docs/BACKEND.md](docs/BACKEND.md) | Auth, routes, Mongo models |
| [docs/MOBILE.md](docs/MOBILE.md) | React Native Family MVP |
| [docs/DEPLOY.md](docs/DEPLOY.md) | VPS Docker / Compose |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Open priorities |

---

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run dev` / `dev:web` | Local Next.js web+API (port 3000) |
| `npm run dev:mobile` | Metro bundler for RN |
| `npm run ios` / `android` | Run RN app |
| `npm run typecheck` | Shared + web TypeScript |
| `npm run seed` | Seed Mongo demo school, users, chats, class desk |
| `npm run build` / `build:web` | Production web build |
| `npm run start` | Serve last web build |
| `npm run build:staging` / `start:staging` | Staging-labelled (port 3001) |
| `npm run build:production` / `start:production` | Production-labelled |
| `npm run docker:build` / `docker:run` | Local image build / run with `.env` |
| `npm run docker:up` / `docker:down` | VPS Compose up/down (`deploy/compose.yml`) |
| `npm run lint` | ESLint (web) |
| `npm test` | Vitest unit tests (web) |

---

## License / status

Private demo project (`"private": true` in `package.json`).
