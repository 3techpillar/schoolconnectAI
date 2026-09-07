# `src/lib` vs `src/shared` vs `packages/shared`

| Path | Role |
|------|------|
| **`packages/shared`** (`@schoolconnect/shared`) | Cross-app DTOs, Zod, roles, product modes — used by web + mobile |
| **`src/lib/shared`** | Web helpers + thin re-exports from the package (`apiFetch`, config) |
| **`src/shared`** | Modular `/api/v1` cross-cuts: RBAC permissions, tenant scope, `requireApiUser` |
| **`src/lib/models`** | Canonical Mongoose schemas (grouped: `core` · `comms` · `ops` · `family` · `erp`) |
| **`src/lib/server`** | HTTP/auth infra + `services/` domain logic |
| **`src/modules`** | Controller/service/repository for `/api/v1` (models re-export from `lib/models`) |
| **`src/components`** | `shell/` phone UI · `admin/` · `erp/` desktop |

Do not import `lib/server/*` from client components.
