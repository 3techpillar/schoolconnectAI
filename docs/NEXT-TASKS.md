# SchoolConnect — Next tasks

Short, ordered work list based on **current** implementation status.  
Full history + open advanced items: [BACKLOG.md](BACKLOG.md).  
Architecture: [ARCHITECTURE.md](ARCHITECTURE.md) · Roles: [ROLES-AND-FEATURES.md](ROLES-AND-FEATURES.md).

**Status snapshot:** Demo-ready core is shipped (auth, chats, circulars, family Zone/Fees, admin, AI stub, `src/` docs). Focus now is **production honesty** and **family/data truth**, not redoing P0/P1 from 2026 mid-sprint.

---

## Do next (recommended order)

### 1. API hygiene rollup — *quick win*
- Wrap remaining mutating routes with `withApiHandler` + Zod (`leaves`, `homework`, `enrollments`, `admin`, `class-desk`, `invites`, `users`, `register`).
- **Done when:** consistent JSON errors; no bare `req.json()` on mutators.

### 2. Parent↔student link UI — *product truth*
- Profile (or dedicated section): list/create/revoke links via `/api/links`.
- Prefer selecting a student over free-text `childName` only.
- **Done when:** parent can link demo student from UI; seed link still works.

### 3. Resolve child via `ParentStudentLink`
- Attendance summary, AI context, and home child framing should use linked student (fallback to `childName`).
- **Done when:** renaming display name does not break attendance resolution for linked pairs.

### 4. Principal ↔ Admin alignment — *one decision*
- Either open `/admin` UI for `principal`, **or** remove `principal` from `/api/admin` allow-list and document teacher-only surface.
- **Done when:** ROLES doc and code match with no mismatch note.

### 5. Firebase Phone Auth (SMS) — *auth honesty*
- Implement BACKLOG Firebase steps; keep `OTP_PROVIDER=demo` for local seed.
- **Done when:** phone path works in staging with Firebase; demo OTP still works locally.

### 6. UX consistency pass
- StatusUI loading/empty/error on circulars, homework, chats list, bus.
- Chat failed-send retry affordance if still thin.
- **Done when:** no blank `app-shell` / silent fail on those screens.

---

## Then (after above)

| Priority | Task |
|----------|------|
| A | Razorpay/UPI on fees (replace demo Pay) |
| B | Chat SSE or delta poll (cut full `/api/chats` payload churn) |
| C | Bus: server-driven progress / less client sim |
| D | Vitest RBAC (`isFamilyRole`, broadcast, bus write, admin gates) |
| E | Split `src/app/globals.css` by surface |
| F | Optional: AI → LLM behind env flag |

---

## Explicitly not next

Do **not** re-open these unless regressing — already done:

- Dedicated `JWT_SECRET`, OTP hash + middleware rate-limit  
- Fees demo POST Pay, home attendance/feed APIs  
- Engage server XP, AI rule stub, Zod on core routes  
- Family nav parity, chat unread/poll, circular→notification  
- `src/` folder move + ARCHITECTURE / ROLES docs  

---

## How to use

1. Pick items **1 → 6** in order unless a release forces Firebase/payments first.  
2. When an item ships, mark it in [BACKLOG.md](BACKLOG.md) and trim this file’s top list.  
3. Keep this file ≤ one screen of “Do next” so it stays actionable.
