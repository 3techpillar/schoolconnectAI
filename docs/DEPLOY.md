# Custom server (VPS) — Docker

SchoolConnect Docker image: [`deploy/Dockerfile`](../deploy/Dockerfile)  
Compose: [`deploy/compose.yml`](../deploy/compose.yml)

## Prerequisites on the server

- Docker Engine + Docker Compose plugin
- MongoDB Atlas (or Mongo reachable from the host) with your server IP allowlisted
- Open firewall port (e.g. `3000`, or `80`/`443` if reverse-proxying)

## 1. Copy the app

```bash
git clone <your-repo-url> schoolconnect
cd schoolconnect
```

## 2. Env file (root)

```bash
cp .env.example .env
nano .env   # or vim
```

Set at least:

| Key | Example |
|-----|---------|
| `MONGO_URI` or `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `NEXT_PUBLIC_APP_URL` | `https://your.domain` (rebuild if you change this — it is baked at build time) |
| `OTP_PROVIDER` | `demo` only for demos |

`NEXT_PUBLIC_*` values are **baked into the image at build**. Change them → rebuild.

## 3. Build & run (recommended)

```bash
docker compose -f deploy/compose.yml up -d --build
docker compose -f deploy/compose.yml logs -f web
curl -s http://127.0.0.1:3000/api/health
```

Expect `"mongo": true` when Atlas/IP/URI are correct.

Seed once (from a machine that can reach Mongo — often your laptop, or exec into a one-off container with the same env):

```bash
# on a host with Node + same .env
npm ci
npm run seed
```

## 4. Plain `docker` (no Compose)

```bash
docker build -f deploy/Dockerfile \
  --build-arg NEXT_PUBLIC_APP_URL=https://your.domain \
  -t schoolconnect:prod .

docker run -d --name schoolconnect --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  schoolconnect:prod
```

## 5. HTTPS (custom domain)

Put Nginx or Caddy in front; proxy to `127.0.0.1:3000`. Example Nginx location:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Open `80`/`443` on the firewall; keep `3000` localhost-only if you proxy.

## 6. Updates

```bash
cd schoolconnect
git pull
docker compose -f deploy/compose.yml up -d --build
```

## robots.txt vs security

[`public/robots.txt`](../public/robots.txt) only **asks** crawlers not to index `/api/`, `/admin`, etc.  
It does **not** block humans, scrapers, or attackers.

Real hardening checklist:

- HTTPS + strong `JWT_SECRET`
- Atlas Network Access (IP allowlist), not open `0.0.0.0/0` in prod
- Do not expose Mongo port publicly
- Turn off demo OTP (`OTP_PROVIDER=demo`) for real users
- Firewall: only 80/443 public when behind a reverse proxy
