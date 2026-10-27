# Architecture

Verified against the repository on 2026-10-27 (`git log -1`: `8d8864a` on
`main`). See [PROJECT_HANDOVER.md](PROJECT_HANDOVER.md) for the project
overview and [NEXT_STEPS.md](NEXT_STEPS.md) for what to do next.

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 | `apps/web` |
| Backend | NestJS 11, TypeScript | `apps/api` |
| Database | PostgreSQL via Prisma 6 | Local: Docker. Production: **Neon** (per prior session conversation — not in any repo file, see "Deployment" below) |
| Cache / sessions | Redis via `ioredis` | Local: Docker. Production: **Upstash** (per prior conversation) |
| Payments | Stripe (Payment Intents + Elements), manual capture, 3DS2/SCA | See [API_INTEGRATIONS.md](API_INTEGRATIONS.md) |
| Flight data | Amadeus + Travelport (Galileo), aggregated | See [API_INTEGRATIONS.md](API_INTEGRATIONS.md) |
| Image storage | Vercel Blob | Owner-uploaded homepage images (hero slides, destination cards, promo cards, promotions) |
| i18n | `next-intl` | Spanish (primary/default) + English, `messages/{es,en}.json` |
| Admin auth | Single bcrypt-hashed password (`ADMIN_PASSWORD_HASH`) | Not a user table — one shared owner login |
| Customer auth | `bcryptjs`, session-based (no JWT) | Separate from admin auth |

Node.js >= 20 required. npm workspaces monorepo (`apps/web`, `apps/api`).

## Repository layout

```
apps/
  api/   NestJS backend — see "Backend module map" below
  web/   Next.js frontend — see "Frontend route map" below
docker-compose.yml   Local Postgres + Redis only
package.json         Root workspace scripts (npm run dev/build/test/docker:*)
README.md            Setup instructions (tracked in git)
PROGRESS.md          Full phase-by-phase build log (gitignored, LOCAL ONLY — see NEXT_STEPS.md)
CLAUDE.md            Persistent instructions for Claude Code (gitignored, LOCAL ONLY)
```

**Important:** `PROGRESS.md` and `CLAUDE.md` at the repo root are in
`.gitignore` (`**/CLAUDE.md` and an explicit `PROGRESS.md` entry) and have
**never been pushed to GitHub**. They only exist on this machine. See
[NEXT_STEPS.md](NEXT_STEPS.md) for why this matters before you cancel
anything or switch machines.

## Backend module map (`apps/api/src`)

One NestJS module per domain; modules don't reach into each other's
internals (`CLAUDE.md`'s stated convention, followed consistently).

| Module | Responsibility |
|---|---|
| `gds/` | **Provider-agnostic GDS aggregation layer.** `GdsService` is the single entry point the rest of the app uses for flights — fans a search out to every provider listed in `GDS_PROVIDERS`, merges results, routes `priceOffer`/`createOrder`/`issueTicket`/`getOrder` back to the owning provider via a `<provider>.<id>` offer id. See [API_INTEGRATIONS.md](API_INTEGRATIONS.md). |
| `amadeus/` | Amadeus provider implementation of `GdsClient`. `self-service/` subfolder holds the only working implementation (OAuth2, Flight Offers Search/Price REST calls, response mapper). `AMADEUS_MODE` env var picks `self-service` vs `enterprise` (enterprise throws "not implemented"). |
| `travelport/` | Travelport (Galileo) provider implementation of `GdsClient`. Auth (`TravelportAuthService`) is real and tested. `searchFlights`/`priceOffer` deliberately throw `GdsNotImplementedError` — no real Travelport API call has been made yet. |
| `search/` | `GET /search/flights`, `POST /search/offers/:offerId/price` — thin controller over `GdsService`, with its own Redis result cache. |
| `booking/` | Session-based booking flow: `POST /booking/start`, `GET /booking/state`, `PUT /booking/passengers`. Booking-in-progress state lives in an httpOnly Redis-backed session cookie, not a DB row, until payment resolves. |
| `payments/` | Stripe integration: `POST /payments/intent`, `POST /payments/webhook`. Manual-capture Payment Intents (capture/void primitives exist but are unused — see [DECISIONS.md](DECISIONS.md)). |
| `account/` | Customer accounts (optional, guest checkout works without it): register/login/logout/me/bookings. Separate from admin auth. |
| `admin/` | Single-password admin login (`POST /admin/login`), guards used by the four CMS modules below. |
| `promotions/`, `hero-slides/`, `destination-cards/`, `promo-cards/` | Four near-identical owner-editable CMS modules (Vercel Blob upload, public GET + admin-guarded CRUD/reorder). See [FEATURE_STATUS.md](FEATURE_STATUS.md) for what each one is for. |
| `health/` | `GET /health` — Terminus health check. Only checks GDS providers actually listed in `GDS_PROVIDERS`; always checks Stripe + Postgres. |
| `config/` | `env.validation.ts` — the full list of required/optional env vars, validated at boot with `class-validator`. **This file is the source of truth for every env var** — read it directly rather than trusting any example file to be exhaustive. |
| `session/` | Custom `RedisSessionStore` (hand-written against `ioredis`, not `node-redis`, since `connect-redis` v9 required the latter). |
| `common/` | Shared utilities: UTC-safe date comparison, a generic Redis-backed per-IP rate limiter (used by both admin and account login). |
| `prisma/` | `PrismaService`/`PrismaModule` — connection does **not** crash the app on failure (logs and continues; see [DECISIONS.md](DECISIONS.md)). |

Full Prisma schema: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)
— 6 models (`Promotion`, `HeroSlide`, `DestinationCard`, `PromoCard`, `User`,
`Booking`). No `Payment`/`Passenger`/`AuditLog`/`Order` tables exist yet
(payments and passengers live only in the Redis session + a `Json` snapshot
on `Booking`).

## Frontend route map (`apps/web/app/[locale]`)

All routes are under `[locale]` (`es` or `en`); `proxy.ts` (Next 16's
`middleware.ts` rename) negotiates locale from `Accept-Language`, defaulting
to Spanish.

| Route | Purpose |
|---|---|
| `/` | Homepage: hero carousel, search widget, promotions banner, promo cards, destination cards, services, trust badges |
| `/search` | Flight search results |
| `/booking/passengers`, `/booking/payment` | Booking funnel (requires an active session from `/search`) |
| `/hajj-umrah` | Real content page + pre-filled search toward Jeddah |
| `/account/login`, `/account/register`, `/account/bookings` | Customer accounts |
| `/admin/login`, `/admin/promotions`, `/admin/hero-slides`, `/admin/destination-cards`, `/admin/promo-cards` | Admin CMS (single shared password) |
| `/coming-soon` | Generic stub for unbuilt nav items (Hotels, Holidays, Travel Guide, etc.) |
| `/cookie-policy` | Real content, not a stub |

Key frontend files:
- `lib/api.ts` — every backend fetch call, in one file
- `lib/types.ts` — hand-maintained mirror of the backend's normalized types (no shared package between `apps/web`/`apps/api` — see [DECISIONS.md](DECISIONS.md))
- `components/site-header.tsx` / `site-footer.tsx` — mounted once in `app/[locale]/layout.tsx`
- `messages/{es,en}.json` — all UI copy; namespaces listed in [FEATURE_STATUS.md](FEATURE_STATUS.md)'s source column where relevant

## Auth

Two **entirely separate** auth systems, both session-cookie-based (no JWT anywhere):
1. **Customer accounts** (`account/`) — `session.userId`, 30-day cookie (`ACCOUNT_SESSION_TTL_SECONDS`), optional (guest checkout works).
2. **Admin** (`admin/`) — `session.isAdmin`, single shared bcrypt-hashed password (`ADMIN_PASSWORD_HASH`), gates all four CMS modules.

Both reuse the same underlying `express-session` + custom `RedisSessionStore`
as the booking flow's own session data — one session cookie (`malik.sid`)
carries booking state, customer login state, and admin login state
simultaneously, keyed by `req.session`.

## Deployment

**No deployment config files exist in this repository** (no `render.yaml`,
`netlify.toml`, `vercel.json`, or CI workflow — confirmed by filesystem
search). Everything below is from this session's conversation history, not
verifiable from repo files, and should be treated as **last known state, not
current fact** — verify directly on Render/Netlify before relying on it:

- **Frontend**: Netlify, discussed live at `alnaafi.netlify.app` (custom domain unknown)
- **Backend**: Render, Node web service. Root directory `apps/api`. Build command discussed: `npm install --include=dev && npx prisma generate && npx nest build`. Start command: `node dist/main`.
- **Database**: Neon (managed Postgres) for production
- **Redis**: Upstash (managed Redis, free tier) for production
- **GitHub**: `https://github.com/Axhar85/travel-agency`, default branch `main`

Local environment variables are **not** representative of production — all
three local `.env`/`.env.local` files point at `localhost`. Production env
vars live only in the Render/Netlify dashboards and were never pasted into
chat (per this project's own standing rule, see `README.md`).

## Local environment setup

See [README.md](README.md) (tracked in git, kept current) for the full
step-by-step. Env var reference: `apps/api/.env.example`,
`apps/web/.env.local.example`, root `.env.example` — all three are accurate
as of this audit (verified by direct comparison against `env.validation.ts`
on 2026-10-27). This satisfies the handover's ".env.example" requirement; a
separate root-level copy was deliberately not created to avoid two sources of
truth drifting apart.

**Docker was not running during this audit** (`docker ps` failed to reach the
daemon) — local Postgres/Redis were not live-verified this session.
