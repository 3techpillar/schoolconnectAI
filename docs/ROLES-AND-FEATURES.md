# Roles & Features — Current Implementation

> **As of:** implementation snapshot matching the codebase under **`src/`**  
> **Scope:** What each role can do **today** (UI + API), not backlog ideas.  
> **Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) (source layout) · [BACKEND.md](./BACKEND.md) · [NEXT-TASKS.md](./NEXT-TASKS.md) · [BACKLOG.md](./BACKLOG.md)

---

## 1. Overview

SchoolConnect is a **WhatsApp-first, mobile** school app. Source code lives in `src/`; browser URLs do not include `src/`. Access is driven by the user’s `role` on their Mongo `User` document (JWT cookie session).

### Roles

| Role | Label | UI bucket |
|------|--------|-----------|
| `parent` | Parent | **Family** (same chrome as student) |
| `student` | Student | **Family** |
| `class_teacher` | Class Teacher | **Teacher** |
| `principal` | Principal | **Teacher** UI · broader **API** |
| `bus_attendant` | Bus Attendant | **Default** (generic home) |
| `admin` | School Admin | **Admin** |
| `super_admin` | Super Admin | **Admin** + Schools tab |

### Role helpers (`src/lib/shared/roles.ts`)

| Helper | True for |
|--------|----------|
| `isFamilyRole` | `parent`, `student` |
| `isSchoolAdminRole` / `isSchoolAdmin` | `admin`, `super_admin` |
| `isSuperAdminRole` | `super_admin` |
| `canBroadcastNotification` | `class_teacher`, `principal`, `admin`, `super_admin` |
| `canWriteBusProgress` | `bus_attendant`, `principal`, `admin`, `super_admin` |
| `canPostAsTeacher` (UI, `school-data.tsx`) | `class_teacher`, `principal` only (**not** admin) |

### Family parity (parent ≈ student)

Parents and students share:

- Bottom nav: **Home · Chats · Homework · Zone · Fees**
- Home dashboard: Learning Zone, fees, bus ETA, attendance, AI
- Engage XP / missions (`POST /api/engage`)
- Homework status updates, fees pay (own ledger), chats, circulars (read), bus track/alerts, AI, leave apply

**Small differences:**

| Topic | Parent | Student |
|-------|--------|---------|
| Home title | Often `{childName}'s day` | `Hey {firstName}!` |
| Parent↔student link | Can `POST /api/links` | Cannot create link |
| Enrollment pending | No | May be locked on `/pending` until approved |
| Self-enrollment row | — | `POST /api/enrollments/self` |
| Attendance context | Via linked student / `childName` | Own class |

---

## 2. Shared features (all authenticated users)

Unless noted, any logged-in school user can:

| Feature | Route / API | Notes |
|---------|-------------|--------|
| Session / profile | `/profile`, `GET/PATCH /api/me` | Role not self-editable after signup |
| Notifications list / mark read | `/notifications`, `/api/notifications*` | School-wide broadcast create = staff only |
| Chats list + thread + send | `/chats`, `/chats/[id]`, `/api/chats*` | Rich post kinds (homework/activity/progress) = teachers |
| Homework list + status | `/homework`, `GET/PATCH /api/homework*` | **Create** = teacher/principal only |
| Circulars read | `/circulars` | Mark circular read via class-desk |
| Fees view + demo Pay | `/fees`, `/api/fees` | Own `FeeAccount` — no staff fee console |
| Bus map / ETA / alerts | `/bus`, `GET /api/bus` | Progress write = `canWriteBusProgress` |
| Attendance calendar (personal) | `/attendance` | Roster marking = teacher UI |
| Home feed | `GET /api/feed` | |
| AI assistant | `/ai`, `POST /api/ai/chat` | Rule-based stub |
| Apply leave | `POST /api/leaves` | Approve = staff |
| Engage **read** | `GET /api/engage` | Mutations = family only |

**Pending enrollment gate:** students / uninvited teachers / principals with `enrollmentStatus !== "approved"` only see **Status** + **Profile** until approved (`/pending`).

---

## 3. Bottom navigation by role

Defined in `src/components/PhoneShell.tsx`.

| Role | Tabs |
|------|------|
| Parent / Student | Home · Chats · Homework · Zone · Fees |
| Class Teacher / Principal | Home · Class · Chats · Homework · Attend |
| Admin / Super Admin | Home · Admin · Chats · Notice · Fees |
| Bus Attendant (default) | Home · Chats · Homework · Attend · Fees |

Header (all): **Notifications** + **Profile** (Sign out lives on Profile).

---

## 4. Feature catalog (product areas)

### 4.1 Auth & enrollment

- Phone/email → OTP → profile (`/auth`)
- Demo OTP: `000000` when demo mode is on
- Teachers / bus / principal often need **invite code** from admin/principal
- Students may wait on `/pending` for class-teacher/admin approval
- Admin/principal: invite teachers, approve enrollments (`EnrollmentDesk`, `/admin` Enroll tab, `/class`)

### 4.2 Home (`/`)

Role-aware dashboards:

- **Family:** Learning Zone card, quick links, attendance/fees/homework/bus stats, Zone + AI banners, recent feed
- **Teacher:** Class desk summary, teaching quick links, class chat CTA
- **Admin:** Admin console hero, promote/notice/fees shortcuts, school/roster/promo stats
- **Bus attendant:** Minimal home (avatar + recent feed only — no dedicated attendant hero)

### 4.3 Admin console (`/admin`)

**UI gate:** `isSchoolAdmin` only (`admin` | `super_admin`).  
**API:** `GET/POST /api/admin` also allows **`principal`** (UI still blocked for principal — known mismatch).

| Tab | School Admin | Super Admin |
|-----|--------------|-------------|
| Overview | Yes | Yes |
| Users (directory, role assign) | Own school; cannot assign `super_admin` | All schools; can assign `super_admin` |
| Enroll | Invites + enrollment desk | Same |
| Promote | Annual pass/retain → next grade | Same |
| Session | Complete / start academic year | Same |
| Schools | — | Activate / pause schools |

### 4.4 Teacher Class Desk (`/class`)

- Roster, attendance by day (P / A / L / H)
- Parent chat shortcuts, promote helpers (demo)
- Enrollment add/approve for class (teacher)
- **Redirects away** if user is not `canPostAsTeacher` (admins use `/admin`, not Class nav)

### 4.5 Attendance & leaves

| Action | Who |
|--------|-----|
| View personal / child calendar | Family + others |
| Mark class roster | Class teacher / principal (Class + Attend UI) |
| Apply leave | Profile UI (family-oriented); API accepts any auth |
| Approve / reject leave | `class_teacher`, `principal`, `admin`, `super_admin` |

Approved leave days show as **L** on the calendar.

### 4.6 Homework

| Action | Who |
|--------|-----|
| List / filter | All |
| Change status (pending → submitted, etc.) | All (own school) |
| Create homework (+ optional chat sync) | `class_teacher`, `principal` only |

### 4.7 Chats

- School threads (class, teacher, office, bus) from seed / upsert
- Unread counts, soft polling, optimistic send
- Teachers post **daily activity / homework / progress** (role-gated server-side)
- Homework create and rich chat posts can create **notifications**

### 4.8 Circulars & notifications

| Action | Who |
|--------|-----|
| Read circulars | All |
| Publish circular | `canBroadcastNotification` (teacher, principal, admin, super_admin) |
| Publish → unread + `type: circular` notification | Server (`circular-service`) |
| Mark circular read | Any school user |
| Broadcast school notification | Staff; non-staff limited to `bus` / `system` self types |

### 4.9 Learning Zone / Engage (`/engage`)

- XP, level, streak, mood, missions, focus timer, badges, weekly challenge
- **Write API:** `parent` + `student` only
- Other roles can open the page; mutations return 403

### 4.10 Fees (`/fees`)

- Per-user outstanding + demo **Pay** (clears ledger)
- Not a school-wide fee admin console

### 4.11 Bus (`/bus`)

| Action | Who |
|--------|-----|
| View route, ETA, stops | All |
| 10 / 5 min home alerts | Profile prefs; notifications |
| Update / reset trip progress | `bus_attendant`, `principal`, `admin`, `super_admin` |

Live simulation ticks only on `/bus` (or family home) to stay lightweight.

### 4.12 AI (`/ai`)

- Full-screen assistant UI; rule-based answers from school context
- Available to all authenticated roles

---

## 5. Role-by-role summary

### Parent

- **Nav / home:** Family surface (full Zone + Fees)
- **Can:** chats, homework status, engage, fees pay, bus track, circulars read, AI, apply leave, link to student
- **Cannot:** teach desk, mark roster, publish circulars, write bus progress, admin/promote/invite, create homework

### Student

- **Same app surface as parent**
- **Extra:** may be enrollment-pending; `POST /api/enrollments/self`
- **Cannot:** create parent↔student link via API; same staff limits as parent

### Class teacher

- **Nav:** Class desk focused
- **Can:** roster attendance, create homework, publish circulars, rich chat posts, approve leaves/enrollments (class), message parents
- **Cannot:** `/admin` UI, create invites (principal/admin), bus progress write, engage XP writes

### Principal

- **UI:** Teacher nav/home (same as class teacher)
- **API:** Admin/invites/enrollments/promotions/sessions + bus write + broadcast
- **Cannot open `/admin` page** (UI restricted to school admin roles) — use APIs / teacher tools instead
- **Cannot:** toggle schools; assign `admin` / `super_admin` via some client paths; engage XP writes

### Bus attendant

- **Nav:** Default (no Class / Admin / Zone)
- **Home:** Minimal
- **Can:** write bus progress/reset; read chats/homework/fees/circulars
- **Cannot:** publish circulars, mark class attendance UI, admin, engage XP, create homework

### School Admin (`admin`)

- **Nav / home:** Admin console first-class
- **Can:** users (own school), roles (not `super_admin`), invites, enrollments, promotions, sessions, publish notices, bus write, leave approve, pay **own** fees
- **Cannot:** Schools pause/activate; Class desk UI; create homework via API; engage XP; change own role from profile

### Super Admin (`super_admin`)

- Everything School Admin has, plus:
  - **Schools** tab — activate / pause
  - Cross-school user directory
  - Assign `super_admin`
- Still **not** teacher Class UI; homework create still teacher/principal-only

---

## 6. Routes × roles (useful access)

| Route | Family | Teacher | Principal | Bus | Admin | Super Admin |
|-------|--------|---------|-----------|-----|-------|-------------|
| `/` | Family dash | Teacher dash | Teacher dash | Minimal | Admin dash | Admin dash |
| `/admin` | No | No | API yes / **UI no** | No | Yes | Yes + Schools |
| `/class` | Redirect | Yes | Yes | Redirect | Redirect | Redirect |
| `/attendance` | Calendar | Mark + leaves | Mark + leaves | Calendar | Calendar | Calendar |
| `/homework` | Status | Create+ | Create+ | Status | Status | Status |
| `/circulars` | Read | Publish | Publish | Read | Publish | Publish |
| `/engage` | Full | UI only | UI only | UI only | UI only | UI only |
| `/fees` | Pay | Own | Own | Own | Own | Own |
| `/bus` | Track | Track | Track+write | Track+write | Track+write | Track+write |
| `/chats` | Yes | Yes | Yes | Yes | Yes | Yes |
| `/notifications` | Yes | +broadcast | +broadcast | Yes | +broadcast | +broadcast |
| `/profile` | Yes | Yes | Yes | Yes | Yes | Yes |
| `/pending` | Student if pending | If pending | If pending | — | — | — |
| `/ai` | Yes | Yes | Yes | Yes | Yes | Yes |

---

## 7. API mutation gates (quick matrix)

| Endpoint | Allowed roles |
|----------|----------------|
| `POST/PUT /api/engage` | `student`, `parent` |
| `POST /api/homework` | `class_teacher`, `principal` |
| `PATCH /api/homework/[id]` | Authenticated (school) |
| `PATCH /api/class-desk` (staff actions) | `canBroadcastNotification` |
| `PATCH /api/class-desk` (`markCircularRead`) | Any school user |
| `POST /api/notifications` (school types) | `canBroadcastNotification` |
| `PATCH /api/bus` (progress/reset) | `canWriteBusProgress` |
| `GET/POST /api/admin` | `admin`, `super_admin`, `principal` |
| `toggleSchool` (admin POST) | `super_admin` only |
| `GET /api/users` | `admin`, `super_admin`, `principal`, `class_teacher` |
| `PATCH /api/users/[id]` | `admin`, `super_admin`, `principal` (+ assign rules) |
| Invites create/patch | `admin`, `super_admin`, `principal` |
| Enrollments staff | `admin`, `super_admin`, `class_teacher`, `principal` |
| `POST /api/enrollments/self` | `student` |
| `PATCH /api/leaves/[id]` | `class_teacher`, `principal`, `admin`, `super_admin` |
| `POST /api/leaves` | Any authenticated |
| `POST /api/links` | `parent` + staff |
| `GET/POST /api/fees` | Any authenticated (own account) |
| Chats / feed / AI / me | Authenticated |

---

## 8. Admin deep-dive

### Responsibilities

1. **Directory** — list users, assign roles (scoped by school unless super admin)
2. **Onboarding** — teacher invites; student enrollments with class teachers
3. **Academic year** — promote students pass/retain; complete/start sessions
4. **Comms** — circulars / notices (via Notice nav + circulars page)
5. **Ops** — bus progress (API); leave approvals

### What Admin is *not* (current)

- Not a full finance console (only personal fee ledger)
- Not the Class Desk UI (no roster marking screen in admin nav)
- Not Learning Zone player (no XP writes)
- School Admin cannot pause other schools (Super Admin only)

### Principal vs Admin (important)

| Capability | Principal | School Admin |
|------------|-----------|--------------|
| Teacher Class UI | Yes | No |
| `/admin` page | No | Yes |
| `/api/admin` | Yes | Yes |
| Create homework | Yes | No |
| Invite teachers | Yes | Yes |
| Toggle schools | No | No (super only) |

---

## 9. Known UI ↔ API mismatches

These are **current** behaviors to be aware of when testing or extending:

1. **Principal** has admin APIs but **cannot** open `/admin` UI.
2. **Admin / Super Admin** can broadcast and patch class-desk via API but have **no Class nav**; cannot `POST` homework.
3. **Bus attendant** can write bus progress but has a **generic** home/nav (no attendant-specific dashboard).
4. **Engage** page has no client redirect; non-family roles get API 403 on write.
5. **Leaves POST** is open to any role at API; Profile apply UX is family-oriented.
6. **Fees Pay** works for staff accounts as their own demo ledger — not school fee admin.

---

## 10. Demo accounts & how to verify

After `npm run seed` (see README):

1. Log in as **parent** and **student** → same nav (Zone + Fees); Zone XP works for both.
2. **Class teacher** → Class desk, create homework, publish circular, mark attendance.
3. **School Admin** → `/admin` users / enroll / promote / session.
4. **Super Admin** → Schools tab + broader directory.
5. **Bus attendant** → `/bus` progress updates; other roles see ETA only.
6. **Principal** → teacher UI; admin APIs work; `/admin` shows restricted message.

Demo OTP: **`000000`** (when demo mode enabled).

---

## 11. Source map

| Concern | Primary files |
|---------|----------------|
| Role helpers | `src/lib/shared/roles.ts` |
| Bottom nav / pending gate | `src/components/PhoneShell.tsx` |
| Home dashboards | `src/app/page.tsx` |
| Teacher UI flag | `src/lib/providers/school-data.tsx` → `canPostAsTeacher` |
| Admin UI | `src/app/admin/page.tsx`, `src/lib/providers/admin-data.tsx` |
| Class desk | `src/app/class/page.tsx`, `src/app/api/class-desk/route.ts`, `src/lib/server/circular-service.ts` |
| Engage | `src/app/engage/page.tsx`, `src/app/api/engage/route.ts` |
| Enrollment | `src/components/EnrollmentDesk.tsx`, `src/app/api/enrollments/*`, `src/app/pending/page.tsx` |
| Auth register / invites | `src/app/api/auth/register/route.ts`, `src/app/api/invites/*` |

---

*This document describes the **current** SchoolConnect implementation. For planned work, see [BACKLOG.md](./BACKLOG.md).*
