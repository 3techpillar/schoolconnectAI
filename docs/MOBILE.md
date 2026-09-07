# React Native mobile app

Family MVP client in [`apps/mobile`](../apps/mobile) (React Native CLI 0.76).  
Shares **the same** Next.js API as web (`apps/web`) via `@schoolconnect/shared` `createApiClient`.

**Docs hub:** [README.md](./README.md) · Setup overview: [../README.md](../README.md) · Modes: [PRODUCT-MODES.md](PRODUCT-MODES.md)

## Architecture

| Piece | Role |
|-------|------|
| `apps/web` | Next.js UI + `/api/*` (Mongo + JWT) |
| `packages/shared` | Roles, DTOs, Zod schemas, theme tokens, `createApiClient` |
| `apps/mobile` | RN CLI Family MVP — Bearer token auth |

Auth:

- OTP verify / register responses include `token`
- Mobile stores JWT in AsyncStorage and sends `Authorization: Bearer <token>`
- Web continues to use httpOnly `sc_session` cookie
- API `requireUser` accepts **cookie or Bearer**

## Setup

```bash
# from repo root
npm install
cp apps/web/.env.example apps/web/.env.local   # set MONGO_URI + JWT_SECRET
# ensure API_PROXY_ENABLED=false in apps/web/.env.local for local /api

# terminal 1 — API (and web)
npm run dev:web

# iOS pods (first time / after native dep changes)
npm run pods -w @schoolconnect/mobile

# terminal 2 — Metro
npm run dev:mobile

# device / emulator
npm run ios
# or
npm run android
```

### API_BASE_URL / local vs staging

React Native does not load `.env` without extra Babel plugins. Edit:

[`apps/mobile/src/config.ts`](../apps/mobile/src/config.ts)

```ts
export const API_MODE: ApiMode = 'staging'; // or 'local'
```

| Target | How |
|--------|-----|
| Staging demo | `API_MODE = 'staging'` (default) |
| Local Next (iOS sim) | `API_MODE = 'local'` → `http://127.0.0.1:3000` |
| Local Next (Android emu) | `API_MODE = 'local'` → `http://10.0.2.2:3000` |
| Physical device | set `API_BASE_URL_OVERRIDE = 'http://<lan-ip>:3000'` |

On web, keep `API_PROXY_ENABLED=false` in `apps/web/.env.local` so `/api` is served by this monorepo (needed for local Bearer testing).

### Demo OTP

Same as web: `000000` when `OTP_PROVIDER=demo`.

Family demo logins (tap on the mobile auth screen, or type the email):

| Identifier | Role | School |
|------------|------|--------|
| `parent@demo.com` | Parent | Green Valley |
| `student@demo.com` | Student | Green Valley |
| `parent@radoms.demo` | Parent | Radoms International |

Full matrix: root [README Demo accounts](../README.md#demo-accounts).

## Family MVP screens

Auth, pending gate, Home, Chats (+ thread), Homework, Fees, Attendance, Circulars, Notifications, Bus, Profile.

Teacher/admin desks remain web-only for now.

## Smoke test (Bearer)

```bash
# after OTP verify, copy token from response
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/api/me"
```

Cookie path (web) unchanged:

```bash
curl -s -c cookies.txt -X POST "$API_BASE_URL/api/auth/otp/verify" \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"demo@school.com","otp":"000000"}'
curl -s -b cookies.txt "$API_BASE_URL/api/me"
```
