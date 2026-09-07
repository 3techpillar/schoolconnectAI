# SchoolConnect docs

Hub for product, architecture, and ops. Setup & scripts live in the root **[README](../README.md)**.

## Start here

| I want to… | Read |
|------------|------|
| **Full business requirements** | **[BRD.md](BRD.md)** (v1.2 — features, diagrams, use cases, FAQs) |
| Campus × mode matrix, transfers, subscription | [PRODUCT-MODES.md](PRODUCT-MODES.md) |
| **Import/export students & teachers (CSV)** | [DATA-IMPORT-EXPORT.md](DATA-IMPORT-EXPORT.md) |
| Run locally / seed / **all demo logins** | [../README.md](../README.md#demo-accounts) |
| See who can do what | [ROLES-AND-FEATURES.md](ROLES-AND-FEATURES.md) |
| Use desktop `/erp` | [ERP.md](ERP.md) |
| Understand code layout & `/api/v1` | [ARCHITECTURE.md](ARCHITECTURE.md) · [../apps/web/src/STRUCTURE.md](../apps/web/src/STRUCTURE.md) |
| Look up APIs & Mongo models | [BACKEND.md](BACKEND.md) |
| Run the React Native app | [MOBILE.md](MOBILE.md) |
| Deploy on a VPS | [DEPLOY.md](DEPLOY.md) |
| See open work | [BACKLOG.md](BACKLOG.md) |

## Product matrix (quick)

| | Connect | Full ERP |
|--|---------|----------|
| **Single** | Harmony | Radoms International |
| **Group** | Sunrise East/West | Radmos Noida/Lucknow |

Free subscription ~1 year per school · transfers: `/transfers` or `/erp/transfers`.

## Map

```text
docs/
├── README.md              ← you are here
├── BRD.md                 # Full BRD (v1.2)
├── PRODUCT-MODES.md       # Mode × campus · transfers · subscription
├── ROLES-AND-FEATURES.md  # Per-role UI / API matrix
├── ERP.md                 # Desktop MDM + school flags
├── DATA-IMPORT-EXPORT.md  # Student & teacher CSV guidelines
├── ARCHITECTURE.md        # Monorepo layout, modular API
├── BACKEND.md             # Auth, routes, collections
├── MOBILE.md              # RN Family MVP
├── DEPLOY.md              # Docker / Compose / HTTPS
└── BACKLOG.md             # Open priorities
```

## Product

- **[BRD.md](BRD.md)** — features, flowcharts, use cases, FAQs  
- **[PRODUCT-MODES.md](PRODUCT-MODES.md)** — Connect/ERP, group/open transfer, free expiry  
- **[ROLES-AND-FEATURES.md](ROLES-AND-FEATURES.md)** — roles, nav, feature catalog  
- **[ERP.md](ERP.md)** — `/erp` + school MDM fields  
- **[DATA-IMPORT-EXPORT.md](DATA-IMPORT-EXPORT.md)** — student & teacher CSV import/export  

## Engineering

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — stack, folder tree, providers, `/api/v1`  
- **[BACKEND.md](BACKEND.md)** — JWT, API map, models  

## Clients & ops

- **[MOBILE.md](MOBILE.md)** · **[DEPLOY.md](DEPLOY.md)** · **[BACKLOG.md](BACKLOG.md)**

---

*Prefer linking here from the root README instead of duplicating long credential tables.*
