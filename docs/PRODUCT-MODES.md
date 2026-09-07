# Product modes & campus types

SchoolConnect combines **two independent axes** (same deploy / DB / API):

| | **Connect** | **Full ERP** |
|--|-------------|--------------|
| **Single campus** | Collab app only | Collab + `/erp` MDM |
| **Multi-campus (group)** | Collab + `/transfers` within `groupCode` | Same + full MDM per campus |

## Mode (`productMode`)

- **`connect`** (default for new schools) — chats, circulars, homework, bus, leave, teacher attendance, light `/admin`, **`/transfers`**. No `/erp` MDM; Fees hidden unless `settings.modules.fees` override.
- **`erp`** — Connect **plus** desktop `/erp` (SIS, admissions, fees structures, exams, ID cards, audit, …).

Upgrade anytime: Super Admin flips mode at `/erp/schools`.

## Group (`groupCode`)

Campuses that share a `groupCode` (e.g. `RADMOS`, `SUNRISE`) can transfer students **within the group**. Destination admin approves.

## Cross-group transfer (`transferPolicy`)

| Policy | Behavior |
|--------|----------|
| `group_only` (default) | Only same `groupCode` |
| `open` | This campus may **receive** transfers from outside its group (still dest-admin approve) |

## Branch module overrides (`settings.modules`)

Per-campus flags override mode defaults, e.g. `{ fees: false }` or `{ bus: false }` on one branch while the peer keeps defaults.

## Subscription (free for 1 year)

No payment gateway yet. Each school has:

- `subscriptionPlan`: `free` (default) or `paid`
- `subscriptionStartsAt` / **`subscriptionExpiresAt`** (default = now + **365 days**)

Super Admin can set/extend the end date on `/erp/schools`. When expired, ERP mutating APIs return 403 until extended. `/api/me` exposes `subscriptionActive` + `subscriptionExpiresAt`.

## Capabilities helpers (`@schoolconnect/shared`)

`schoolCapabilities` · `schoolHasModule` · `canAccessErpConsole` · `isSubscriptionActive` · `defaultSubscriptionExpiry`

`/api/me` returns `productMode`, `capabilities`, `transferPolicy`, subscription fields.

## Demo seed matrix

| | Connect | Full ERP |
|--|---------|----------|
| **Single** | Harmony (`admin@connect.demo`) | Radoms International (`admin@radoms.demo`, open intake) |
| **Group** | Sunrise East/West (`SUNRISE`) | Radmos Noida/Lucknow (`RADMOS`; Lucknow fees off) |

Full credentials: root [README Demo accounts](../README.md#demo-accounts).

## Related

[Docs hub](./README.md) · [BRD.md](./BRD.md) · [ERP.md](./ERP.md) · [ROLES-AND-FEATURES.md](./ROLES-AND-FEATURES.md)
