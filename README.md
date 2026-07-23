# SchoolConnect AI

WhatsApp-first school communication app for parents, teachers, staff, and admins.
Track attendance, homework, fees, circulars, live bus ETA, and ask an in-app AI assistant — all in a mobile-first UI.

> **Note:** This is a UI / demo product. Auth and data are client-side (`localStorage`). There is no real backend, payment gateway, WhatsApp API, or AI model yet.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Requirements](#requirements)
5. [Environments](#environments)
6. [Local development](#local-development)
7. [Staging](#staging)
8. [Production](#production)
9. [Deployment](#deployment)
10. [Demo login](#demo-login)
11. [Important instructions](#important-instructions)
12. [Scripts reference](#scripts-reference)

---

## Features

| Area | What it does |
|------|----------------|
| **Auth** | Phone or email → OTP → profile setup (role, school, class, child). Role is saved permanently for that identity |
| **Home** | Role-aware dashboards for parent, student, teacher, admin |
| **School Admin** | Users & roles, annual grade promotion, academic sessions, school overview (`/admin`) |
| **Super Admin** | Multi-school activate/pause, assign School Admin / Super Admin, plus all admin tools |
| **Teacher Class Desk** | Roster, quick attendance marks, daily activity post, parent DMs, announcements |
| **Student Zone** | XP/levels, streaks, mood check-in, daily missions, focus timer, weekly challenge, badges |
| **Chats** | WhatsApp-style threads + emoji reactions. Teachers post daily activity, homework & progress |
| **Notifications** | Unread alerts for homework, activity, progress, fees, circulars |
| **Homework** | Filter, status updates; teachers post with **submission deadline**; overdue highlighted |
| **Attendance** | Calendar + leave history; approved leaves show as **L**; teachers approve pending leaves |
| **Profile** | Account info + **apply leave** + leave history |
| **Fees** | Outstanding amount, Pay now UI, payment history + receipts |
| **Circulars** | School notices/events feed with filters and bookmarks |
| **Bus tracking** | Simulated live map, ETA, driver card, route stops |
| **AI assistant** | Chat-style UI with suggestions and composer (mock replies) |
| **Shell** | Mobile phone shell, role-based bottom nav |

**Visual theme:** Colors, fonts (**Sora** + **Inter**), shadows, and motion timing match `schoolsetu-demo.html` (blue `#2563EB`, paper `#F7F9FD`, ink `#0F172A`, 0.18s UI / 0.5s feed / 0.7s reveal).

**Roles supported in signup:** Parent, Student, Class Teacher, Bus Attendant, Principal, School Admin, Super Admin.

### Admin vs Super Admin

| Capability | School Admin | Super Admin |
|------------|--------------|-------------|
| School user directory | Own school | All schools |
| Change user roles | Yes (not Super Admin) | Yes (including Super Admin) |
| Annual class promotion (pass → next grade) | Yes | Yes |
| Complete / start academic session | Yes | Yes |
| Activate / pause schools | No | Yes |
| Teacher class desk | No (uses Admin console) | No |

### Student grade promotion

At annual session end, Admin opens **Admin → Promote**, marks each student **Pass** or **Retain**, then **Apply promotion**. Pass moves `6-B` → `7-B` (section kept); Retain keeps the same class. History is stored on the student profile (`classHistory`).

---

## Tech stack

- **Next.js 15** (App Router) → build output in `.next/`
- **React 19** + **TypeScript**
- **Plain CSS** (`app/globals.css`) — no Tailwind / Radix / UI kits
- Inline SVG icons (`components/Icons.tsx`)
- Config via env (`lib/config.ts`)

---

## Project structure

```text
app/                 # Routes (/, /auth, /chats, /chats/[id], /notifications, /homework, ...)
components/          # PhoneShell, Icons
lib/                 # auth, config, school-data (chats / notifications / homework)
public/              # Static assets
.env.development     # Local defaults (auto-loaded by `next dev`)
.env.staging         # Staging defaults (reference / copy)
.env.production      # Production defaults (auto-loaded by `next build` / `next start`)
.env.example         # Documented template
Dockerfile           # Container image for Node deploy
vercel.json          # Vercel project hints
```

---

## Requirements

- **Node.js 20.19+ or 22.12+** (recommended: **22 LTS**)
- npm (comes with Node)

```bash
node -v   # should be v22.x (or supported 20.x)
npm -v
```

If you use `nvm`:

```bash
nvm use 22
```

---

## Environments

| Env | Purpose | Typical URL | App flag |
|-----|---------|-------------|----------|
| **development** | Local machine | `http://localhost:3000` | `APP_ENV=development` |
| **staging** | Pre-prod / QA | `https://staging.example.com` | `APP_ENV=staging` |
| **production** | Live users | `https://app.example.com` | `APP_ENV=production` |

### Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Server-side env label | `development` / `staging` / `production` |
| `NEXT_PUBLIC_APP_ENV` | Client-visible env label | same as above |
| `NEXT_PUBLIC_APP_NAME` | Display name | `SchoolConnect AI` |
| `NEXT_PUBLIC_APP_URL` | Public base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_DEMO_MODE` | Show demo UX hints | `true` |
| `NEXT_PUBLIC_DEMO_OTP` | Fixed demo OTP | `000000` |

> Only use `NEXT_PUBLIC_*` for non-secret values. Anything in `NEXT_PUBLIC_*` is shipped to the browser.

Copy the template when needed:

```bash
cp .env.example .env.local
```

`.env*.local` is gitignored — use it for machine-specific overrides.

---

## Local development

```bash
git clone <repo-url>
cd schoolconnect
npm install
npm run dev
```

Open **http://localhost:3000**.

Next.js loads `.env.development` automatically in dev.

Optional local overrides:

```bash
cp .env.development .env.local
# edit .env.local
npm run dev
```

Run the UI against **staging-labelled** env on port 3001:

```bash
npm run dev:staging
# http://localhost:3001
```

---

## Staging

Use staging for QA before production.

### 1) Build & run on a server (Node)

```bash
npm ci
cp .env.staging .env.production.local   # bake staging public env into the build
npm run build:staging
npm run start:staging                   # port 3001
```

Or set the same keys in the host’s environment UI (preferred on Vercel / Railway / etc.) and run:

```bash
npm ci
npm run build:staging
npm run start:staging
```

### 2) Staging on Vercel (Preview)

1. Import the repo in [Vercel](https://vercel.com).
2. Project → **Settings → Environment Variables** → scope **Preview**.
3. Set:

```text
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_NAME=SchoolConnect AI (Staging)
NEXT_PUBLIC_APP_URL=https://<your-preview-or-staging-domain>
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_OTP=000000
```

4. Every PR / non-production branch deploy becomes a staging-like preview.

Update `.env.staging` `NEXT_PUBLIC_APP_URL` to your real staging domain.

---

## Production

### Build & run (Node process)

```bash
npm ci
npm run build:production   # creates .next/
npm run start:production   # listens on :3000
```

Or:

```bash
npm run build
npm start
```

(`next build` / `next start` load `.env.production` by default.)

### Production checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to the real HTTPS domain
- [ ] Confirm Node 22+ on the host
- [ ] `npm ci` (not a random local `node_modules` copy)
- [ ] Health-check `/` and `/auth` after deploy
- [ ] Do **not** force-push / rewrite published git history (see Important instructions)

---

## Deployment

### A) Vercel (recommended for Next.js)

```bash
npm i -g vercel
vercel            # preview / staging-style
vercel --prod     # production
```

Or connect the GitHub/GitLab repo in the Vercel dashboard:

| Vercel env | Maps to |
|------------|---------|
| Preview | Staging |
| Production | Production |

Set env vars under **Project → Settings → Environment Variables** for Preview and Production separately.

`vercel.json` is included for framework defaults.

### B) Docker

```bash
# Build (production defaults)
docker build -t schoolconnect:prod .

# Or pass staging build-args
docker build \
  --build-arg APP_ENV=staging \
  --build-arg NEXT_PUBLIC_APP_ENV=staging \
  --build-arg NEXT_PUBLIC_APP_NAME="SchoolConnect AI (Staging)" \
  --build-arg NEXT_PUBLIC_APP_URL=https://staging.example.com \
  -t schoolconnect:staging .

docker run --rm -p 3000:3000 schoolconnect:prod
```

Helper scripts:

```bash
npm run docker:build
npm run docker:run
```

### C) Any Node host (VM / PM2 / Railway / Render)

```bash
npm ci
npm run build:production
# process manager example:
# pm2 start npm --name schoolconnect -- run start:production
npm run start:production
```

Expose port **3000** (or set `PORT`).

---

## Demo login

1. Open `/auth`
2. Enter any phone or email
3. Click **Send OTP**
4. Enter OTP **`000000`** (or whatever `NEXT_PUBLIC_DEMO_OTP` is)
5. Complete profile on first login

Session is stored in the browser (`localStorage` keys `sc_auth_user_v1`, `sc_users_v1`, `sc_admin_data_v1`).

**Role persistence:** On first profile setup, the selected role is written to `sc_users_v1` under that phone/email. Re-login with the same identifier restores that role — you are not asked to pick again.

**Try Admin:** Sign up as **School Admin** or **Super Admin** → open **Admin** in the bottom nav (`/admin`) → Users / Promote / Session (/ Schools for Super Admin).

---

## Important instructions

1. **Node version** — Use Node **22** (or 20.19+). Older Node fails Vite/Next tooling.
2. **Build output** — `npm run build` must succeed and produce a **`.next/`** folder before `npm start` or Docker run.
3. **No real secrets in `NEXT_PUBLIC_*`** — those values are public in the client bundle.
4. **Demo only** — OTP, fees “Pay now”, AI send, and bus map are UI simulations. Do not treat as production school data.
5. **Git / Lovable** — This repo history may sync with Lovable. **Do not force-push, rebase, or rewrite commits already on the remote** or project history can break. Keep `main` deployable.
6. **Env files** — Commit `.env.development`, `.env.staging`, `.env.production`, `.env.example`. Never commit `.env.local` or real production secrets.
7. **Install** — Prefer `npm ci` in CI/CD and servers for reproducible installs.
8. **Auth redirect** — Protected routes send users to `/auth`. Optional: `/auth?redirect=/fees`.
9. **Routes to smoke-test after deploy** — `/`, `/auth`, `/admin`, `/engage`, `/class`, `/chats`, `/chats/class-6b`, `/notifications`, `/homework`, `/attendance`, `/fees`, `/circulars`, `/bus`, `/ai`.
10. **Teacher posting** — Sign up as **Class Teacher** or **Principal**. Use `/class` for roster + daily activity, `/attendance` to mark P/A/L/H, `/homework` to post tasks, `/circulars` to announce, and chats for progress notes / parent DMs.
11. **Admin / promotion** — Sign up as **School Admin** or **Super Admin**. Use `/admin` for users, annual promotion (Pass → next class), and sessions. Super Admin also manages schools.
12. **Student engagement** — Register as **Student** to get Student Zone in the bottom nav (XP, streaks, missions, focus timer). Parents/teachers can still open `/engage` from the sparkles icon.

---

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Local development (port 3000) |
| `npm run dev:staging` | Local with staging labels (port 3001) |
| `npm run build` | Production build → `.next/` |
| `npm run build:staging` | Staging-labelled build |
| `npm run build:production` | Production-labelled build |
| `npm run start` | Serve last build (port 3000) |
| `npm run start:staging` | Serve on port 3001 |
| `npm run start:production` | Serve production on port 3000 |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run container on port 3000 |

---

## License / status

Private demo project (`"private": true` in `package.json`). Not licensed for public redistribution unless you add a license file.
