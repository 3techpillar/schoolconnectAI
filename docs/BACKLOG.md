# SchoolConnect — Product backlog

Living backlog aligned with the **current** codebase (`src/` layout, family parity, chats/circulars hardening).  
Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [BACKEND.md](BACKEND.md) · [ROLES-AND-FEATURES.md](ROLES-AND-FEATURES.md) · [NEXT-TASKS.md](NEXT-TASKS.md) · [DEPLOY.md](DEPLOY.md)

**Verdict (Aug 2026 refresh):** Core school demo is **shippable for demos** — auth, enrollment, chats, homework, circulars+notifs, class desk, engage (family), fees demo Pay, bus ETA, AI stub, admin console, `src/` architecture docs.  

**Still open for production honesty:** real SMS OTP (Firebase), payment gateway, realtime (replace poll/sim), API hardening rollup, family **links UI**, principal/admin UI↔API alignment.

| Metric | Value |
|--------|--------|
| API route modules | ~33 |
| Shared UI components | 5+ (`PhoneShell`, Icons, StatusUI, EnrollmentDesk, WelcomeSketch) |
| Runtime deps | next, react, react-dom, mongoose, jose, zod |
| Historical P0/P1 ship-blockers | **all done** |
| Active next focus | See [NEXT-TASKS.md](NEXT-TASKS.md) |

---

## Screen ↔ API maturity

| Area | Status | Notes |
|------|--------|--------|
| Auth / me / pending | Ready (demo OTP) | JWT + hashed OTP + middleware; Firebase SMS still open |
| Chats / homework / notifs | Ready | Unread, soft poll, optimistic send; no SSE yet |
| Class desk / circulars | Ready | Publish → unread + circular notification |
| Leaves / enroll / admin | Ready | Role-gated; principal `/admin` UI mismatch remains |
| Bus track | Partial | API state + client simulation; attendants can write progress |
| Fees ledger | Partial | GET + demo POST Pay; gateway open |
| Home attendance / Recent | Ready | `/api/attendance/summary` + `/api/feed` |
| Learning Zone | Ready (family) | Server XP; parent + student |
| AI assistant | Stub ready | Rules → LLM later |
| Parent↔student links | API ready | Seed + `/api/links`; **no manage UI** yet |
| Project layout / docs | Ready | `src/` + ARCHITECTURE / ROLES docs |

---

## Shipped history (do not delete)

### P0 — Ship blockers — **all done**

| # | Task | Touchpoints | Status |
|---|------|-------------|--------|
| 1 | Dedicated `JWT_SECRET` (no URI fallback) | `src/lib/server/secrets.ts`, `.env.example` | done |
| 2 | OTP rate-limit + hash; demo tip only if `demoMode` | `otp-service`, middleware, auth page | done |
| 3 | No session/directory `localStorage` when backend up | `providers/auth.tsx` | done |
| 4 | Student self-enrollment row | `enrollment-service`, `POST /api/enrollments/self` | done |
| 5 | `POST /api/fees` + Pay wired | `fees-service`, fees page | done |
| 6 | `ensureStudentEnrollment` hits API when backend | `providers/enrollment.tsx` | done |

### P1 — Product truth — **all done**

| # | Task | Touchpoints | Status |
|---|------|-------------|--------|
| 1 | Attendance summary on home | `attendance-service`, home | done |
| 2 | Home feed API | `feed-service`, home | done |
| 3 | Role-gate bus write + notification broadcast | `roles.ts`, bus + notifications routes | done |
| 4 | Shared Empty / Error / Loading | `components/StatusUI.tsx` | done |
| 5 | Fees: no silent FALLBACK when authenticated | fees page | done |
| 6 | Shared parseJson + `withApiHandler` (core routes) | `request.ts`, `http.ts` | done\* |

\*Not every mutating route uses the wrapper yet — see **Next P0**.

### P2 — Improvements shipped

| Track | Task | Status |
|-------|------|--------|
| Frontend | Interactive AI chat UI | done |
| Backend | `POST /api/ai/chat` rule stub | done |
| Backend | Zod (OTP, fees, engage, AI, chats, links, …) | done\* |
| Backend | Engage server-side XP | done |
| Backend | Parent↔student link model + `/api/links` + seed | done |
| Deps / DX | zod, eslint, vitest, CI lint+test | done |
| Ops | OTP middleware | done |
| Product | Family parity (parent ≈ student nav/Zone/Fees) | done |
| Product | Chat unread + soft poll + optimistic UX | done |
| Product | Circular publish → notif + mark-read | done |
| Docs | `src/` layout, ARCHITECTURE, ROLES-AND-FEATURES | done |
| UX | Split `globals.css` | **open** (partial intent) |
| Advanced | Realtime SSE/WS | **open** |
| Advanced | Razorpay/UPI | **open** |
| Advanced | Firebase Phone Auth | **open** |

---

## Next backlog (current priorities)

### Next P0 — Production honesty & API hygiene

| # | Task | Why | Touchpoints | Status |
|---|------|-----|-------------|--------|
| N1 | Firebase Phone Auth (`OTP_PROVIDER=firebase`) | Real SMS sign-in; keep demo path for seed | auth page, new firebase helpers, otp routes, `.env.example` | open |
| N2 | Roll `withApiHandler` + Zod to remaining mutators | Consistent 4xx/5xx JSON; fewer silent failures | leaves, homework, enrollments, admin, class-desk, invites, users, register | open |
| N3 | Prod env checklist | Demo OTP off outside demo; strong `JWT_SECRET` | `.env.example`, DEPLOY.md | open |

### Next P1 — Product truth & role clarity

| # | Task | Why | Touchpoints | Status |
|---|------|-----|-------------|--------|
| N4 | Parent↔student **link UI** on profile | API exists; parents still edit free-text `childName` | profile page, `/api/links` | open |
| N5 | Resolve child context via `ParentStudentLink` | Attendance/AI/fees should use link, not name string | attendance-service, ai-service, home | open |
| N6 | Principal ↔ `/admin` alignment | API allows principal; UI blocks — pick one | admin page **or** admin API roles | open |
| N7 | StatusUI + send/error polish on remaining screens | Consistency with fees/home | circulars, homework, chats list, bus | open |
| N8 | Vitest for roles / RBAC helpers | Links row claimed “tests”; only utils/OTP covered | `tests/`, `roles.ts` | open |

### Next P2 — Scale & polish

| # | Task | Why | Status |
|---|------|-----|--------|
| N9 | Razorpay/UPI replace demo Pay | Real fee settlement | open |
| N10 | Chat SSE (or tighter delta poll) | Less full-payload polling | open |
| N11 | Bus GPS / server-driven progress | Replace client sim for attendants | open |
| N12 | Split `globals.css` by surface | Maintainability | open |
| N13 | AI → LLM provider behind flag | Upgrade stub when needed | open |
| N14 | i18n (Hindi/English) | School audience | open |

---

## Firebase Phone Auth (SMS) — detail

Phone authentication: Firebase SMS OTP → verify ID token on server → issue existing `sc_session` JWT. Mongo `User` remains the app identity store.

| Step | Work | Touchpoints |
|------|------|-------------|
| 1 | Firebase project + Phone Auth; env keys | `.env.example`, DEPLOY.md |
| 2 | Client SMS request + confirm | `src/app/auth/page.tsx`, `src/lib/client/firebase-auth.ts` |
| 3 | Server verify ID token → `sc_session` | `otp-service` or `firebase-auth.ts`, auth routes |
| 4 | `OTP_PROVIDER=firebase` \| `demo` | Keep demo for local seed |
| 5 | E.164 + reCAPTCHA / App Check | auth UI + Firebase console |

**Out of scope v1:** WhatsApp OTP; passwordless email-only.

---

## Dependencies note

**Present:** Next 15, React 19, Mongoose 9, jose, zod, eslint, vitest.  
**Still missing for prod:** payment SDK, Firebase SMS (or equivalent), optional i18n / LLM SDK.

Keep the stack lean for demo. Prefer thin additions over UI kits.

---

## Suggested sprint order (forward-looking)

1. **Now — honesty:** Firebase OTP path **or** finish Zod/`withApiHandler` rollup + prod env checklist  
2. **Next — family truth:** Links UI + resolve child via `ParentStudentLink` + principal/admin decision  
3. **Then — polish:** StatusUI consistency, RBAC tests, CSS split  
4. **Later — scale:** Razorpay → chat SSE → bus GPS → LLM  

Immediate actionable list: **[NEXT-TASKS.md](NEXT-TASKS.md)**.

---

## How to update this file

When a task ships, set **Status** to `done` (keep the row). Move items from “Next” into “Shipped history” if useful. Update [NEXT-TASKS.md](NEXT-TASKS.md) so the top 5 stay accurate.
