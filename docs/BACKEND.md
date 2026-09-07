# SchoolConnect — Backend

Next.js App Router API (`apps/web/src/app/api`) + MongoDB (Mongoose) + JWT (cookie or Bearer).

When `MONGO_URI` or `MONGODB_URI` is configured and `/api/health` returns `"mongo": true`, clients call these APIs.

**Docs hub:** [README.md](./README.md) · **Modes:** [PRODUCT-MODES.md](PRODUCT-MODES.md) · **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) (includes modular `/api/v1`) · **ERP:** [ERP.md](ERP.md) · **CSV:** [DATA-IMPORT-EXPORT.md](DATA-IMPORT-EXPORT.md) · **Transfers / subscription:** see PRODUCT-MODES + seed in root README

---

## Code layout (server-relevant)

Source lives under **`src/`**. HTTP URLs do not include `src/` (e.g. file `src/app/api/fees/route.ts` → `POST /api/fees`).

| Path | Role |
|------|------|
| `src/lib/shared/` | roles, dates, config, api-client, engage-defaults, class-utils, money, bus-defaults |
| `src/lib/providers/` | Client contexts that call these APIs |
| `src/lib/server/auth.ts` | JWT + `sc_session` cookie |
| `src/lib/server/response.ts` | `jsonOk` / `jsonError` |
| `src/lib/server/http.ts` | `requireDb` / `requireUser` / `withApiHandler` |
| `src/lib/server/request.ts` | `parseJsonBody` / `readTrimmed` / `normalizeIdentifier` |
| `src/lib/server/secrets.ts` | Dedicated `JWT_SECRET` (no Mongo URI fallback) |
| `src/lib/server/hash.ts` | OTP HMAC helpers |
| `src/lib/server/services/*` | Domain services (otp, chat, erp, csv, seed, …) |
| `src/lib/server/validate.ts` + `schemas.ts` | Zod body validation |
| `src/middleware.ts` | OTP path rate limit |
| `src/lib/db/mongodb.ts` | Connection (`MONGO_URI` \| `MONGODB_URI`) |
| `src/lib/models/{core,comms,ops,family,erp}/` | Mongoose schemas + `*ToClient` |
| `src/app/api/**` | Route handlers |

`jsonOk` / `jsonError` are also re-exported from `src/lib/server/auth.ts` for existing route imports.

Full folder + provider tree: **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Quick start

```bash
# .env or .env.local
MONGO_URI=mongodb+srv://...
JWT_SECRET=long-random-secret
OTP_PROVIDER=demo

npm run seed
npm run dev
curl -s http://localhost:3000/api/health
```

Expected health (happy path):

```json
{ "ok": true, "status": "ok", "mongo": true, "time": "..." }
```

---

## Auth model

| Item | Detail |
|------|--------|
| Cookie | `sc_session` (httpOnly, `SameSite=Lax`, 14 days) |
| Token | JWT (HS256) via `jose`; payload: `sub` (user id), `role`, `schoolId`, `enrollmentStatus` |
| OTP | `OTP_PROVIDER=demo` stores challenges in Mongo; code from `OTP_DEMO_CODE` or `NEXT_PUBLIC_DEMO_OTP` / `000000` |
| Register | Requires a recent verified OTP marker for that identifier |

### Auth flow

1. `POST /api/auth/otp/send` `{ identifier }`
2. `POST /api/auth/otp/verify` `{ identifier, otp }`  
   - Existing user → sets cookie, returns `{ existing: true, user }`  
   - New → `{ existing: false, verified: true }`
3. `POST /api/auth/register` profile fields (+ `inviteCode` for teachers)
4. `GET /api/me` / `PATCH /api/me` — current user
5. `POST /api/auth/logout` — clears cookie

---

## Seeded demo data

`npm run seed` creates:

| Field | Value |
|-------|--------|
| School | Green Valley Public School (Pune) |
| Class | 6-B |
| Super Admin | `super@schoolconnect.demo` |
| School Admin | `admin@greenvalley.demo` |
| Class Teacher | `teacher@greenvalley.demo` (6-B) |
| Parent | `parent@demo.com` |
| Student | `student@demo.com` (approved) |
| Invite | `TCH-DEMO-6B` → `newteacher@greenvalley.demo` |
| Demo OTP | `000000` |

Also bootstraps sample chats, messages, homework, notifications, class desk roster, **bus route stops**, and **fee ledgers** (parent/student) via `src/lib/server/seed-school.ts` (also runs lazily on first API read if empty).

---

## API map

All JSON responses are shaped like `{ ok: true, ... }` or `{ ok: false, error: "..." }`.  
Authenticated routes require the `sc_session` cookie (browser `credentials: "include"`).

### System

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/health` | No | `{ mongo: boolean, status }` |

### Auth / me

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/api/auth/otp/send` | No | |
| POST | `/api/auth/otp/verify` | No | |
| POST | `/api/auth/register` | No | Needs prior OTP verify |
| POST | `/api/auth/logout` | Cookie optional | Clears session |
| GET | `/api/me` | Yes | |
| PATCH | `/api/me` | Yes | Profile / bus prefs |

### Users (admin directory)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/users` | Admin / principal / class teacher | Scoped by school/class |
| PATCH | `/api/users/[id]` | Admin / principal | `role`, `className`, `enrollmentStatus` |

### Invites & enrollments

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/invites` | Admin / principal | |
| POST | `/api/invites` | Admin / principal | Create teacher invite |
| PATCH | `/api/invites/[id]` | Admin / principal | `{ status: "revoked" }` |
| GET | `/api/invites/lookup` | No | `?code=` or `?identifier=` (pending only) |
| GET | `/api/enrollments` | Teacher / admin | |
| POST | `/api/enrollments` | Teacher / admin | Add student pending |
| PATCH | `/api/enrollments/[id]` | Teacher / admin | `approved` / `rejected` |

### School messaging

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/chats` | Yes | Chats + `messagesByChat`; auto-seeds demo |
| POST | `/api/chats` | Yes | Upsert thread by `slug` |
| GET | `/api/chats/[id]` | Yes | Messages for chat slug |
| POST | `/api/chats/[id]` | Yes | Send message; may create homework/notif |
| PATCH | `/api/chats/[id]` | Yes | Mark read |
| GET/POST | `/api/homework` | Yes / teacher | List / create |
| PATCH | `/api/homework/[id]` | Yes | Status |
| GET/POST | `/api/notifications` | Yes | |
| PATCH | `/api/notifications/[id]` | Yes | Mark read |
| POST | `/api/notifications/read-all` | Yes | |

### Leaves & class desk

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET/POST | `/api/leaves` | Yes | Apply leave |
| PATCH | `/api/leaves/[id]` | Teacher / admin | Approve / reject |
| GET/PATCH | `/api/class-desk` | Yes / teacher | Roster, attendance, circulars, promote |

### Admin / engage / bus

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/admin` | Admin / principal | Sessions, schools, promotion log, users |
| POST | `/api/admin` | Admin / principal | `action`: `promote` \| `completeSession` \| `startNextSession` \| `toggleSchool` |
| GET/PUT/POST | `/api/engage` | Student | GET state; POST `{ action }` for XP rules; PUT rejects xp writes |
| GET/POST | `/api/links` | Parent / staff | List or create parent↔student links |
| PATCH | `/api/links/[id]` | Party / staff | `status` / `primary` / `relationship` |
| POST | `/api/ai/chat` | Yes | Rule-based assistant using fees/HW/attendance/feed |
| GET/PATCH | `/api/bus` | Yes | GET all; PATCH progress/reset = bus staff/admin; `fired` any school user |
| GET/POST | `/api/fees` | Yes | Ledger GET; POST records demo payment (clears outstanding) |
| POST | `/api/enrollments/self` | Student | Idempotent ensure pending enrollment row |
| GET | `/api/attendance/summary` | Yes | Month present-% from class desk |
| GET | `/api/feed` | Yes | Home circulars + homework slice (+ homework counts) |

### ERP / MDM (`/api/erp/*`)

Requires ERP console access (`requireErpUser`: role + school `productMode: erp` + active subscription; Super Admin exempt for onboarding). Detail: [ERP.md](ERP.md) · CSV: [DATA-IMPORT-EXPORT.md](DATA-IMPORT-EXPORT.md).

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/erp/students/csv` | Export / import StudentProfile (upsert `admissionNo`) |
| GET/POST | `/api/erp/staff/csv` | Export / import StaffProfile (upsert `employeeId`) |
| GET/POST/PATCH | `/api/erp/transfers` | Campus transfers (also usable from Connect `/transfers`) |
| * | `/api/erp/schools`, `students`, `staff`, `classes`, `subjects`, `admissions`, `fees`, `exams`, `leaves`, `attendance/csv`, `id-cards`, `links`, `sessions`, `dashboard`, `overview`, `audit` | Desktop MDM |

Modular clients may prefer `/api/v1/*` — see [ARCHITECTURE.md](ARCHITECTURE.md#15-modular-api-modules--apiv1).

---

## Main Mongo collections (models)

| Model | File | Purpose |
|-------|------|---------|
| `School` | `src/lib/models/core/School.ts` | Schools |
| `User` | `src/lib/models/core/User.ts` | Accounts / roles / enrollment |
| `Class` | `src/lib/models/core/Class.ts` | Grade-section per school |
| `OtpChallenge` | `src/lib/models/core/OtpChallenge.ts` | OTP + TTL |
| `TeacherInvite` | `src/lib/models/core/TeacherInvite.ts` | Staff invites |
| `StudentEnrollment` | `src/lib/models/core/StudentEnrollment.ts` | Student approval pipeline |
| `Chat` / `Message` | `comms/` | Messaging |
| `Homework` / `Notification` | `comms/` | Assignments & alerts |
| `Leave` | `ops/Leave.ts` | Leave requests |
| `ClassDesk` | `ops/ClassDesk.ts` | Roster + attendance + circulars |
| `AdminData` | `core/AdminData.ts` | Sessions + promotion log |
| `StudentEngage` | `family/StudentEngage.ts` | Per-user XP state |
| `ParentStudentLink` | `family/ParentStudentLink.ts` | Parent ↔ student FK links |
| `BusState` / `BusRoute` | `ops/` | Live bus progress / route |
| `FeeAccount` | `family/FeeAccount.ts` | Outstanding fees + payment history |
| `StudentProfile` / `StaffProfile` | `erp/` | ERP SIS / staff MDM (+ CSV) |
| `BranchTransfer` | `erp/BranchTransfer.ts` | Inter-campus transfer requests |
| `FeeStructure` / `FeeInvoice` / `FeePayment` | `erp/` | ERP fee catalog + invoices |
| `AdmissionApplication`, `Subject`, `Exam`, `ExamMark`, `AcademicSession`, `ErpAuditLog` | `erp/` | ERP MDM |

Connection helper: `src/lib/db/mongodb.ts`  
- Accepts **`MONGODB_URI` or `MONGO_URI`**  
- `serverSelectionTimeoutMS: 10000` so Atlas IP issues fail fast  

---

## Client wiring

| Provider file | API when Mongo up |
|---------------|-------------------|
| `src/lib/providers/auth.tsx` | `/api/auth/*`, `/api/me`, `/api/users` |
| `src/lib/providers/enrollment.tsx` | `/api/invites`, `/api/enrollments` |
| `src/lib/providers/school-data.tsx` | `/api/chats`, `/api/homework`, `/api/notifications` |
| `src/lib/providers/leaves.tsx` | `/api/leaves` |
| `src/lib/providers/teacher-class.tsx` | `/api/class-desk` |
| `src/lib/providers/admin-data.tsx` | `/api/admin` |
| `src/lib/providers/student-engage.tsx` | `/api/engage` GET + POST actions |
| AI page | `/api/ai/chat` |
| `src/lib/providers/bus-track.tsx` | `/api/bus` (+ `/api/me` for home stop) |
| Fees page | `/api/fees` |

Shared fetch helper: `src/lib/shared/api-client.ts` (`credentials: "include"`).  
Engage defaults (badges/missions): `src/lib/shared/engage-defaults.ts`.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Seed / app can’t connect | Atlas **Network Access** IP allowlist |
| Health `mongo: false` | Env key name; restart `next dev` after `.env` change |
| 401 on APIs | Cookie not set — complete OTP login again |
| Teacher signup blocked | Need pending invite (`TCH-DEMO-6B` or Admin-created) |
| Student stuck on `/pending` | Approve enrollment in Admin / Class enroll desk |

---

## Security notes (demo vs prod)

- Demo OTP and open Atlas `0.0.0.0/0` are **local/demo only**.
- Rotate `JWT_SECRET` for any shared environment.
- Do not commit real `.env` secrets; use `.env.example` as the template.
- Replace `OTP_PROVIDER=demo` before real parent/teacher rollouts.
