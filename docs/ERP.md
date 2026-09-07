# SchoolConnect ERP

Desktop MDM at `/erp` — **same MongoDB and `/api`** as web + mobile.

> Only schools with **`productMode: "erp"`** and an **active subscription**. Connect schools use the phone app + `/admin` + `/transfers`. See [PRODUCT-MODES.md](./PRODUCT-MODES.md). Super Admin can always open ERP to onboard / switch modes / extend expiry.

**Docs hub:** [README.md](./README.md) · **Modes:** [PRODUCT-MODES.md](./PRODUCT-MODES.md) · **CSV import/export:** [DATA-IMPORT-EXPORT.md](./DATA-IMPORT-EXPORT.md) · **Backend:** [BACKEND.md](./BACKEND.md) · **BRD:** [BRD.md](./BRD.md)

## Data ownership

| Data | Written by | Consumed by |
|------|------------|-------------|
| School, Class, StudentProfile, StaffProfile | `/api/erp/*` | Apps (class-desk, enrollments, fees, leaves) |
| ClassDesk roster | Sync from StudentProfile | Teacher desk, attendance, leave→L |
| Leaves | Family/teacher apply; staff/ERP approve | ClassDesk **L** marks |
| FeeStructure / FeeInvoice | ERP | Family `/api/fees` |
| ParentStudentLink | ERP + seed | Family child context |
| BranchTransfer | `/api/erp/transfers` (Connect + ERP admins) | Campus moves (group or open) |
| Circulars / homework | App APIs | ERP overview (read-only) |
| User (auth) | Register / OTP | All clients |

## Access

- Roles: `admin`, `principal`, `super_admin`, `accountant` (`canAccessErp`) **and** school `productMode === "erp"` (`canAccessErpConsole`)
- Subscription must be active (`subscriptionExpiresAt` in the future) for non–super-admin ERP API use
- Tenant: school-scoped via `schoolId`; `super_admin` may pass `?schoolId=`

## Key APIs

`/api/erp/schools` · `students` (+ **`students/csv`**) · `classes` · `subjects` · `admissions` · `dashboard` · `overview` · `attendance/csv` · `fees` · `exams` · `staff` (+ **`staff/csv`**) · `id-cards` · `links` · **`transfers`** (group + open intake; also usable from Connect `/transfers`) · `sessions` · `leaves` · `audit`

Bulk CSV guidelines (templates, columns, upsert rules): [DATA-IMPORT-EXPORT.md](./DATA-IMPORT-EXPORT.md). UI: `/erp/students`, `/erp/staff`.

Day-to-day app routes remain `/api/class-desk`, `/api/enrollments`, `/api/leaves`, `/api/fees`, …

## Schools MDM fields (Super Admin)

| Field | Purpose |
|-------|---------|
| `productMode` | `connect` \| `erp` |
| `groupCode` | Multi-campus group id |
| `transferPolicy` | `group_only` \| `open` |
| `subscriptionExpiresAt` | Free/paid end date (~1 year default) |
| `settings.modules` | Per-campus feature overrides |

## Demo

```bash
npm run seed && npm run dev:web
```

OTP `000000`. Prefer matrix logins from [README Demo accounts](../README.md#demo-accounts), e.g.:

- ERP single: `admin@radoms.demo` → `/erp`
- ERP group: `admin.noida@radmos.demo` → `/erp/transfers`
- Connect group: `admin.east@sunrise.demo` → `/transfers`
