# SchoolConnect — Backlog

Living open-work list.

**Docs hub:** [README.md](./README.md) · [PRODUCT-MODES.md](PRODUCT-MODES.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [ROLES-AND-FEATURES.md](ROLES-AND-FEATURES.md)

**Shipped (do not re-open):** auth/JWT/OTP demo, enrollment, chats, homework, circulars, class desk, leave→L, engage XP, fees demo Pay, bus ETA, AI stub, `/admin`, desktop `/erp` MDM, modular `/api/v1`, **Connect vs ERP**, **group + cross-group transfers**, **free 1-year subscription expiry**, branch `settings.modules` overrides, **student & staff CSV import/export**, full demo matrix seed, **parent↔student links UI** (Profile + ERP Links), **principal ↔ `/admin`**, family **/report** snapshot, ERP **report-cards picker** + nav.

---

## Open priorities

### P0 — Production honesty

| # | Task | Status |
|---|------|--------|
| 1 | Firebase Phone Auth (`OTP_PROVIDER=firebase`); keep demo for seed | open |
| 2 | Roll `withApiHandler` + Zod to remaining mutators | open |
| 3 | Prod env checklist (demo OTP off; strong `JWT_SECRET`) | open |

### P1 — Product truth

| # | Task | Status |
|---|------|--------|
| 4 | Parent↔student link UI on profile (`/api/links`) | done |
| 5 | Resolve child context via `ParentStudentLink` (attendance/AI/home) | open |
| 6 | Principal ↔ `/admin` UI alignment | done |
| 7 | StatusUI polish on circulars / homework / chats / bus | open |
| 8 | Vitest for RBAC / product-mode helpers | open |

### P2 — Scale

| # | Task | Status |
|---|------|--------|
| 9 | Razorpay/UPI replace demo Pay | open |
| 10 | Chat SSE or delta poll | open |
| 11 | Bus GPS / server-driven progress | open |
| 12 | Split `globals.css` by surface | open |
| 13 | AI → LLM behind env flag | open |
| 14 | i18n (Hindi/English) | open |

---

## Firebase Phone Auth (short)

Firebase SMS OTP → verify ID token → issue `sc_session` JWT. Keep `OTP_PROVIDER=demo` for local seed. Out of scope v1: WhatsApp OTP.

---

## Suggested order

1. API hygiene **or** Firebase OTP  
2. Links UI + child resolve + principal/admin decision  
3. Payments → realtime chat → bus GPS → LLM  
