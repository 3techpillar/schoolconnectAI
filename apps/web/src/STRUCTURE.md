# `src/lib` vs `packages/shared`

| Path | Role |
|------|------|
| **`packages/shared`** (`@schoolconnect/shared`) | Cross-app DTOs, Zod, roles, product modes — used by web + mobile |
| **`src/lib/shared`** | Web helpers + thin re-exports from the package (`apiFetch`, config) |
| **`src/components`** | `shell/` phone UI · `admin/` · `erp/` desktop |

Note: Backend code (models, services, routes, modules) has been migrated to `apps/server/src`.
