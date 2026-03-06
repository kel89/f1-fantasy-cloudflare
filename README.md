# F1 Fantasy — Cloudflare Edition

A private F1 fantasy league app. Predict driver finishing order for each race, earn points when you're right.

**Stack:** React 18 + Vite → Cloudflare Pages, Hono.js → Cloudflare Workers, D1 (SQLite), KV

---

## Project Structure

```
f1-fantasy-cloudflare/
├── apps/
│   ├── api/        Hono.js Worker (REST API)
│   └── web/        React + Vite SPA
└── packages/
    └── shared/     Shared TypeScript types + scoring logic
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Wrangler v3 (installed as a dev dependency — use `pnpm exec wrangler` inside `apps/api`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create secrets file

Create `apps/api/.dev.vars` (gitignored — never committed):

```
JWT_SECRET=your-secret-at-least-32-chars-long
REFRESH_SECRET=another-secret-at-least-32-chars-long
```

Generate each value with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Apply database migrations

```bash
pnpm --filter @f1/api migrate:local
```

This creates the D1 schema locally and seeds the 2026 calendar (24 races, 22 drivers, 11 teams).

### 4. Start dev servers

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:8787

The Vite dev server proxies `/api/*` requests to the Worker automatically.

---

## Admin Setup (local)

After signing up for an account through the app:

```bash
cd apps/api
pnpm exec wrangler d1 execute f1-fantasy-db --local \
  --command "UPDATE users SET admin=1 WHERE email='your@email.com'"
```

Then log out and back in — the new JWT will include the admin flag.

Admin accounts get access to the `/admin` dashboard for scoring races and managing users.

---

## Running Tests

```bash
pnpm --filter @f1/api test
```

Tests cover scoring logic, JWT sign/verify, PBKDF2 password hashing, and Zod input validation.

---

## Deployment

> **Prerequisites:** A [Cloudflare account](https://dash.cloudflare.com/sign-up) with Wrangler authenticated (`cd apps/api && pnpm exec wrangler login`).

The app deploys as two separate Cloudflare products:

- **Worker** — the REST API (`apps/api/`)
- **Pages** — the React frontend (`apps/web/`)

In production, the frontend calls the Worker over HTTPS. Because they are on different subdomains (`workers.dev` vs `pages.dev`), refresh token cookies are set with `SameSite=None; Secure` to allow cross-origin transmission.

---

### Step 1 — Set your Cloudflare Account ID

Go to **dash.cloudflare.com → right sidebar → Account ID**.

Open `apps/api/wrangler.toml` and set:

```toml
account_id = "your-actual-account-id"
```

---

### Step 2 — Create the D1 database

```bash
cd apps/api
pnpm exec wrangler d1 create f1-fantasy-db
```

Wrangler prints a `database_id`. Copy it into `apps/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "f1-fantasy-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### Step 3 — Create the KV namespace

```bash
pnpm exec wrangler kv namespace create JWT_BLACKLIST
```

Wrangler prints a namespace `id`. Copy it into `apps/api/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "JWT_BLACKLIST"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

### Step 4 — Apply database migrations to production

```bash
pnpm --filter @f1/api migrate:remote
```

This creates the schema and seeds all 24 races and 22 drivers.

---

### Step 5 — Set production secrets

```bash
cd apps/api
echo "your-secret-value" | pnpm exec wrangler secret put JWT_SECRET
echo "your-other-secret" | pnpm exec wrangler secret put REFRESH_SECRET
```

Secrets are stored in Cloudflare — they are never in `wrangler.toml` or version control.

---

### Step 6 — Deploy the Worker

```bash
cd apps/api
pnpm run deploy
```

Wrangler prints the Worker's public URL:

```
https://f1-fantasy-api.your-subdomain.workers.dev
```

Keep this URL — you'll need it in the next step.

---

### Step 7 — Create the Pages project (first deploy only)

```bash
pnpm exec wrangler pages project create f1-fantasy --production-branch main
```

---

### Step 8 — Build and deploy the frontend

```bash
cd apps/web
VITE_API_URL=https://f1-fantasy-api.your-subdomain.workers.dev pnpm build
cd ../api
pnpm exec wrangler pages deploy ../web/dist --project-name f1-fantasy
```

The `VITE_API_URL` is baked into the JS bundle at build time so the frontend knows where to send API requests.

---

### Step 9 — Promote yourself to admin

Sign up through the app, then run:

```bash
cd apps/api
pnpm exec wrangler d1 execute f1-fantasy-db --remote \
  --command "UPDATE users SET admin=1 WHERE email='your@email.com'"
```

Then log out and back in.

---

### Step 10 — Update CORS (if using a custom domain)

If you attach a custom domain to your Pages project, add it to the CORS allowlist in `apps/api/src/index.ts`:

```ts
origin.includes("yourdomain.com")
```

Then redeploy the Worker (`cd apps/api && pnpm run deploy`).

---

## Re-deploying

**Worker only** (API changes):

```bash
cd apps/api
pnpm run deploy
```

**Frontend only** (UI changes):

```bash
cd apps/web
VITE_API_URL=https://f1-fantasy-api.your-subdomain.workers.dev pnpm build
cd ../api
pnpm exec wrangler pages deploy ../web/dist --project-name f1-fantasy
```

**Database migrations** (schema changes):

```bash
pnpm --filter @f1/api migrate:remote
```

---

## Scoring

Points are only awarded when you correctly predict a driver's exact finishing position:

| Position | Points |
|----------|--------|
| 1st | 25 |
| 2nd | 18 |
| 3rd | 15 |
| 4th | 12 |
| 5th | 10 |
| 6th | 8 |
| 7th | 6 |
| 8th | 4 |
| 9th | 2 |
| 10th | 1 |
| 11th+ | 0 |

Rosters lock when the race status changes to `locked` or `scored`. The lock is enforced server-side.

---

## 2026 Race Calendar

Race start times are in UTC.

| Rd | Race | Date | UTC |
|----|------|------|-----|
| 1 | Australian GP | Mar 8 | 04:00 |
| 2 | Chinese GP | Mar 15 | 07:00 |
| 3 | Japanese GP | Mar 29 | 05:00 |
| 4 | Bahrain GP | Apr 12 | 15:00 |
| 5 | Saudi Arabian GP | Apr 19 | 17:00 |
| 6 | Miami GP | May 3 | 20:00 |
| 7 | Canadian GP | May 24 | 20:00 |
| 8 | Monaco GP | Jun 7 | 13:00 |
| 9 | Spanish GP (Barcelona) | Jun 14 | 13:00 |
| 10 | Austrian GP | Jun 28 | 13:00 |
| 11 | British GP | Jul 5 | 14:00 |
| 12 | Belgian GP | Jul 19 | 13:00 |
| 13 | Hungarian GP | Jul 26 | 13:00 |
| 14 | Dutch GP | Aug 23 | 13:00 |
| 15 | Italian GP | Sep 6 | 13:00 |
| 16 | Madrid GP | Sep 13 | 13:00 |
| 17 | Azerbaijan GP | Sep 26 | 11:00 |
| 18 | Singapore GP | Oct 11 | 12:00 |
| 19 | United States GP | Oct 25 | 20:00 |
| 20 | Mexico City GP | Nov 1 | 20:00 |
| 21 | São Paulo GP | Nov 8 | 17:00 |
| 22 | Las Vegas GP | Nov 22 | 04:00 |
| 23 | Qatar GP | Nov 29 | 16:00 |
| 24 | Abu Dhabi GP | Dec 6 | 13:00 |

---

## 2026 Driver Grid

| Team | Drivers |
|------|---------|
| McLaren | Norris (#4), Piastri (#81) |
| Mercedes | Russell (#63), Antonelli (#12) |
| Red Bull | Verstappen (#3), Hadjar (#6) |
| Ferrari | Leclerc (#16), Hamilton (#44) |
| Williams | Albon (#23), Sainz (#55) |
| Racing Bulls | Lawson (#30), Lindblad (#41) |
| Aston Martin | Alonso (#14), Stroll (#18) |
| Haas | Ocon (#31), Bearman (#87) |
| Audi | Bortoleto (#5), Hulkenberg (#27) |
| Alpine | Gasly (#10), Colapinto (#43) |
| Cadillac | Perez (#11), Bottas (#77) |

testline
