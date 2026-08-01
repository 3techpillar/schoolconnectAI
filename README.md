# SchoolConnect AI

WhatsApp-first school communication app for parents, teachers, staff, and admins.
Track attendance, homework, fees, circulars, live bus ETA, and ask an in-app AI assistant — all in a mobile-first UI.

> **Backend:** Next.js `src/app/api` + **MongoDB (Mongoose)** + JWT cookie sessions.  
> When `MONGO_URI` / `MONGODB_URI` is set and reachable, the app is **API-dependent**.  
> Without Mongo, providers fall back to browser `localStorage` (offline / UI-only demo).

More detail:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — source layout, layers, providers, services, route map
- **[docs/BACKEND.md](docs/BACKEND.md)** — API map + models
- **[docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md)** — per-role access, admin, feature matrix
- **[docs/NEXT-TASKS.md](docs/NEXT-TASKS.md)** — ordered next sprint (current priorities)
- **[docs/DEPLOY.md](docs/DEPLOY.md)** — custom VPS / Docker
- **[docs/BACKLOG.md](docs/BACKLOG.md)** — full backlog history + open advanced items

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
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
14. [Architecture docs](#architecture-docs)
15. [Roles & features](#roles--features)
16. [Next tasks & backlog](#next-tasks--backlog)

---

## Features

| Area | What it does |
|------|----------------|
| **Auth** | Phone or email → OTP → profile. Role persisted. Teachers need admin invite code |
| **Enrollment** | Admin invites teachers; admin/class teacher add students; students wait on `/pending` |
| **Home** | Role-aware dashboards (family / teacher / admin) |
| **School Admin** | Users & roles, annual grade promotion, sessions (`/admin`) |
| **Super Admin** | Multi-school activate/pause + all admin tools |
| **Teacher Class Desk** | Roster, attendance P/A/L/H, daily activity, parent DMs |
| **Learning Zone** | XP, streaks, mood, missions, focus timer, badges (`/engage`) — parent & student |
| **Chats** | WhatsApp-style threads; teachers post activity / homework / progress |
| **Notifications** | Homework, activity, progress, fees, circulars, bus |
| **Homework** | Deadlines, status updates, overdue highlight |
| **Attendance / Leaves** | Calendar; approved leaves as **L**; teachers approve leaves |
| **Fees** | Outstanding + Pay UI (demo) |
| **Circulars** | School notices (staff publish) |
| **Bus tracking** | Live ETA, stops between pickup, alerts at **10 min** and **5 min** |
| **AI assistant** | In-app school Q&A |

**Roles:** Parent, Student, Class Teacher, Bus Attendant, Principal, School Admin, Super Admin.  
**Family parity:** Parent and student share the same nav and core features (Zone + Fees). Full matrix: **[docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md)**.

### Admin vs Super Admin

| Capability | School Admin | Super Admin |
|------------|--------------|-------------|
| School user directory | Own school | All schools |
| Change user roles | Yes (not Super Admin) | Yes (including Super Admin) |
| Annual class promotion | Yes | Yes |
| Complete / start academic session | Yes | Yes |
| Activate / pause schools | No | Yes |

---

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **MongoDB** via **Mongoose**
- **JWT** sessions (`jose`) in httpOnly cookie `sc_session`
- **Plain CSS** (`src/app/globals.css`)
- Config: `src/lib/shared/config.ts`

---

## Project structure

Application source is under **`src/`** (Next.js standard). Tests, docs, scripts, and deploy stay at repo root.

```text
src/                      # Application source
  app/                    # Pages + app/api/*  → URLs /… and /api/…
  components/             # PhoneShell, EnrollmentDesk, Icons, StatusUI, WelcomeSketch
  lib/
    shared/               # roles, dates, config, api-client, engage-defaults, class-utils, money
    providers/            # Auth, school-data, class, engage, leaves, enrollment, bus, admin
    server/               # JWT, Zod, domain services, seed-school
    db/mongodb.ts         # connectMongo (MONGO_URI | MONGODB_URI)
    models/               # Mongoose schemas + *ToClient
  middleware.ts           # OTP path rate limit
public/                   # Static assets (robots.txt, …)
tests/                    # Vitest unit tests
scripts/seed.ts           # Demo school + users + sample data
docs/                     # ARCHITECTURE, BACKEND, ROLES, DEPLOY, BACKLOG
deploy/                   # Dockerfile + compose (build context = repo root)
.env.example              # Env template
tsconfig.json             # @/* → ./src/*
vitest.config.mts
```

Import paths (`@/*` → `src/*`):

```ts
import { useAuth } from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";
```

Deep dive: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** (layers, provider tree, services, route map).

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
npm run seed
npm run dev
```

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

Successful seed looks like:

```text
Connecting to MongoDB…
Connected.
Created school Green Valley Public School
Created class 6-B
Super admin: super@schoolconnect.demo
Admin: admin@greenvalley.demo
Teacher: teacher@greenvalley.demo
Parent: parent@demo.com
Student: student@demo.com
Invite code: TCH-DEMO-6B
Seeded chats / homework / class desk demo data
Done.
```

Seed is **idempotent** (safe to re-run). It also bootstraps demo chats, homework, notifications, and class desk for that school.

### Common seed / connect errors

| Symptom | Cause | Fix |
|---------|--------|-----|
| Hangs, then IP whitelist error | Atlas Network Access | Add current IP or `0.0.0.0/0` |
| `MONGO_URI is not set` | Env not loaded | Put URI in `.env` / `.env.local` |
| `mongo: false` on `/api/health` | Next can’t see env | Restart `npm run dev` after editing env |

---

## Demo accounts

After `npm run seed`, sign in on `/auth` with these emails (or any new identity):

| Identifier | Role | Notes |
|------------|------|--------|
| `super@schoolconnect.demo` | Super Admin | Multi-school tools |
| `admin@greenvalley.demo` | School Admin | Invites, enrollments, `/admin` |
| `teacher@greenvalley.demo` | Class Teacher | Class `6-B` desk |
| `parent@demo.com` | Parent | Fees, bus, leaves |
| `student@demo.com` | Student | Engage + class access (approved) |

**OTP:** `000000` (or `NEXT_PUBLIC_DEMO_OTP` / `OTP_DEMO_CODE`).

**Teacher invite (new teacher signup):** code `TCH-DEMO-6B`  
(or create a fresh invite from Admin → Enroll).

**School name in seed:** `Green Valley Public School`.

Session cookie: `sc_session` (httpOnly). Profile is also mirrored locally for offline UX.

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
8. Smoke routes: `/`, `/auth`, `/admin`, `/engage`, `/class`, `/chats`, `/homework`, `/attendance`, `/fees`, `/circulars`, `/bus`, `/ai`, `/api/health`.
9. Teachers need an **invite code** from School Admin; students may stay on `/pending` until enrollment is approved.
10. Full API list and models: **[docs/BACKEND.md](docs/BACKEND.md)**. System layers: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. Roles & features: **[docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md)**.

---

## Architecture docs

| Doc | Contents |
|-----|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | **Source layout**, layers, provider tree, services, UI route map, request path |
| [docs/BACKEND.md](docs/BACKEND.md) | Auth model, seed data, full API map, Mongo collections |
| [docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md) | Per-role access, admin deep-dive, route/API matrices |
| [docs/NEXT-TASKS.md](docs/NEXT-TASKS.md) | Ordered next sprint (what to build now) |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Shipped history + open P0/P1/P2 / advanced roadmap |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Custom VPS Docker, Compose, Nginx HTTPS, robots vs security |

---

## Roles & features

Detailed current-implementation summary (every role, admin console, shared features, UI↔API notes):

**[docs/ROLES-AND-FEATURES.md](docs/ROLES-AND-FEATURES.md)**

---

## Next tasks & backlog

**What to do next (short list):** **[docs/NEXT-TASKS.md](docs/NEXT-TASKS.md)**

1. Zod / `withApiHandler` rollup on remaining APIs  
2. Parent↔student link UI + resolve child via links  
3. Principal ↔ `/admin` alignment  
4. Firebase SMS OTP (keep demo for local)  
5. Then: Razorpay, chat SSE, bus GPS, CSS split  

**Full backlog (shipped history + open advanced):** **[docs/BACKLOG.md](docs/BACKLOG.md)**

Historical P0/P1 (JWT, OTP hash, fees Pay, home feed, etc.) are **done** — do not restart those unless regressing.

---

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Local Next.js (port 3000) |
| `npm run seed` | Seed Mongo demo school, users, chats, class desk |
| `npm run build` | Production build → `.next/` |
| `npm run start` | Serve last build |
| `npm run build:staging` / `start:staging` | Staging-labelled (port 3001) |
| `npm run build:production` / `start:production` | Production-labelled |
| `npm run docker:build` / `docker:run` | Local image build / run with `.env` |
| `npm run docker:up` / `docker:down` | VPS Compose up/down (`deploy/compose.yml`) |
| `npm run lint` | ESLint (Next core-web-vitals) |
| `npm test` | Vitest unit tests |

---

## License / status

Private demo project (`"private": true` in `package.json`).
