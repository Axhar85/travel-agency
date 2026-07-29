# Naafi Travels — Flight Booking Platform

Flight booking website for an IATA-accredited travel agency based in Madrid,
Spain, specializing in flights to Pakistan, India, Bangladesh, the
Philippines, Latin America, and Hajj & Umrah travel.

## Tech stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS, with
  Spanish (primary) / English i18n
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL via Prisma
- **Cache / sessions**: Redis
- **Payments**: Stripe (Payment Intents + Elements, 3DS2/SCA)
- **Flight data**: Amadeus Self-Service REST API (sandbox)
- **Image storage**: Vercel Blob (owner-managed homepage promotions)

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (ships with Node)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for
  local Postgres and Redis. On Windows this requires WSL2 (Windows 11 Home
  has no other backend option); on macOS/Linux it works out of the box.

## Getting started

### 1. Install dependencies

```bash
npm install
```

This is an npm workspaces monorepo (`apps/web`, `apps/api`) — one install at
the root covers both apps.

### 2. Set up environment variables

Copy each example file and fill in values as needed:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

- **Root `.env`** — only read by `docker-compose.yml` for the local
  Postgres/Redis containers. The defaults work fine for local dev.
- **`apps/api/.env`** — backend config. `DATABASE_URL`, `REDIS_URL`,
  `CORS_ORIGIN`, and `SESSION_SECRET` are required for the app to start at
  all (generate a `SESSION_SECRET` with `openssl rand -base64 32`, or any
  random string for local dev). Everything else (Amadeus, Stripe, Vercel
  Blob, admin password — see below) is optional: the app starts and runs
  without them, just with those specific features unavailable.
- **`apps/web/.env.local`** — `NEXT_PUBLIC_API_URL` should point at the
  backend (`http://localhost:4000` by default).  If you want to test
  Stripe's card element locally, also fill in
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### 3. Start Postgres and Redis

```bash
npm run docker:up
```

Check both containers report healthy:

```bash
docker compose ps
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
cd ../..
```

### 5. Run the app

```bash
npm run dev
```

This starts both apps together — frontend at
[http://localhost:3000](http://localhost:3000), backend at
[http://localhost:4000](http://localhost:4000). To run them separately:

```bash
npm run dev:web   # frontend only
npm run dev:api   # backend only
```

Visit `http://localhost:3000/es` (Spanish) or `http://localhost:3000/en`
(English).

## Optional credentials

None of these are required to run the app locally — each one only unlocks a
specific feature, and everything else keeps working without it.

| Credential | Where it goes | Unlocks | Get it from |
|---|---|---|---|
| `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET` | `apps/api/.env` | Real flight search results (without it, search fails gracefully with a "temporarily unavailable" message) | [developers.amadeus.com](https://developers.amadeus.com) (Self-Service sandbox) |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | `apps/api/.env` / `apps/web/.env.local` | Card payments on the booking flow | [dashboard.stripe.com](https://dashboard.stripe.com) (test mode keys) |
| `STRIPE_WEBHOOK_SECRET` | `apps/api/.env` | Payment status updates from Stripe | Run `stripe listen --forward-to localhost:4000/payments/webhook` with the [Stripe CLI](https://docs.stripe.com/stripe-cli) — it prints the secret |
| `BLOB_READ_WRITE_TOKEN` | `apps/api/.env` | Uploading images in the admin promotions panel | Create a Blob store at [vercel.com](https://vercel.com) (works independently of where the app itself is hosted) |
| `ADMIN_PASSWORD_HASH` | `apps/api/.env` | Logging into `/admin/promotions` | Run `npm run admin:hash-password -- "your-password"` from `apps/api` and paste the printed hash — never a plaintext password |

**Never paste a real API key or password into a chat with an AI assistant**
(including Claude) — always add it directly to the `.env` file yourself.

## Useful scripts

Run from the repo root unless noted:

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend together |
| `npm run dev:web` / `npm run dev:api` | Start just one app |
| `npm run build` | Production build of both apps |
| `npm run docker:up` / `npm run docker:down` | Start/stop local Postgres + Redis |
| `npm test` | Backend test suite |
| `npm run test:amadeus` | Backend tests scoped to the Amadeus module |
| `npm run test:payments` | Backend tests scoped to the payments module |

Inside `apps/api`:

| Command | Description |
|---|---|
| `npx prisma migrate dev` | Apply database migrations |
| `npx prisma studio` | Browse the database in a GUI |
| `npm run admin:hash-password -- "password"` | Print a bcrypt hash for `ADMIN_PASSWORD_HASH` |

## Project structure

```
apps/
  web/   Next.js frontend (App Router, TypeScript, Tailwind)
  api/   NestJS backend (TypeScript)
docker-compose.yml   Local Postgres + Redis for development
```

Within `apps/api/src`, each business domain is its own module (`search`,
`booking`, `payments`, `admin`, `promotions`, `amadeus`) — modules don't
reach into each other's internals directly.
