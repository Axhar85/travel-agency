# Progress

## Phase 1 — Foundation & Amadeus Self-Service connectivity: DONE

### What's built
- **Monorepo**: npm workspaces, `apps/web` (Next.js 16 App Router + TS +
  Tailwind v4) and `apps/api` (NestJS 11 + TS). Root `npm run dev` runs both.
- **i18n (frontend)**: `next-intl`, Spanish as primary/default locale, English
  as secondary (`apps/web/i18n/routing.ts`). All routes live under
  `app/[locale]/`; `proxy.ts` (Next 16's renamed `middleware.ts` convention)
  negotiates locale from `Accept-Language`, falling back to Spanish. Verified
  locally: `/es` and `/en` both render correctly, the in-page locale switcher
  works, `next build` produces static `/es` and `/en` pages, `tsc --noEmit`
  and `eslint` are clean. Translation dictionaries live in
  `apps/web/messages/{es,en}.json` — add new keys there as Phase 2 builds
  the real search UI.
- **Docker Compose** (`docker-compose.yml`): Postgres 16 + Redis 7, env-driven
  credentials/ports, healthchecks. **Not verified end-to-end** — Docker isn't
  installed on this dev machine, so `docker compose up` / `npm run docker:up`
  has not actually been run. Compose file is written and should work; please
  test it once Docker Desktop is available.
- **Env config**: `.env.example` at root (docker-compose vars) and in each app
  (`apps/api/.env.example`, `apps/web/.env.local.example`), plus real `.env`
  files populated with local-dev defaults (gitignored). NestJS `ConfigModule`
  validates all required vars at boot via `class-validator`
  ([env.validation.ts](apps/api/src/config/env.validation.ts)) — the app
  refuses to start with missing/malformed config.
- **Prisma**: datasource + generator wired to `DATABASE_URL`
  ([schema.prisma](apps/api/prisma/schema.prisma)), `PrismaService` /
  `PrismaModule` (global, connects/disconnects with app lifecycle). No domain
  models yet — those land with Booking/Payment/AuditLog in Phases 3/5/6.
- **Redis**: `RedisModule` (global) provides an `ioredis` client via
  `REDIS_CLIENT` token, used today only by the Amadeus offer cache.
- **AmadeusModule** ([apps/api/src/amadeus](apps/api/src/amadeus)) — the
  swappable GDS abstraction:
  - `GdsClient` interface (`searchFlights`, `priceOffer`, `createOrder`,
    `issueTicket`, `getOrder`) + normalized domain types (`FlightOffer`,
    `PricedOffer`, `Passenger`, `GdsOrder`, etc.) in
    [interfaces/gds-client.interface.ts](apps/api/src/amadeus/interfaces/gds-client.interface.ts) —
    nothing outside this module touches raw Amadeus REST shapes.
  - `AmadeusService` — the only class the rest of the app should ever inject;
    delegates to whatever's bound to the `GDS_CLIENT` DI token.
  - `AmadeusSelfServiceClient` (in `self-service/`) — today's implementation:
    OAuth2 client-credentials flow (`AmadeusAuthService`, token cached with a
    60s expiry safety margin, concurrent-request coalescing), `searchFlights`
    via Flight Offers Search v2, `priceOffer` via Flight Offers Price v1.
  - `AmadeusModule`'s `GDS_CLIENT` provider reads `AMADEUS_MODE` and picks the
    implementation — **this is the only place that config flag is read**.
    Requesting `AMADEUS_MODE=enterprise` currently throws a clear "not
    implemented yet" error at boot (fail fast, not a silent no-op).
  - Domain-specific errors (`AmadeusAuthError`, `AmadeusApiError`,
    `OfferExpiredError`, `GdsNotImplementedError`) so raw axios/Amadeus error
    shapes never leak past this module either.
- **Health check**: `GET /health` (Terminus) verifies Amadeus OAuth2
  connectivity via `AmadeusHealthIndicator`. Will report `down` until real
  sandbox credentials are set in `apps/api/.env`.
- **Tests**: 15 passing (`npm run test:amadeus` — auth token fetch/caching/
  coalescing/error-wrapping, offer cache, search/price mapping and error
  wrapping, price-change detection, Phase-5 stub methods, DI facade
  delegation). Full `npm test` also green. Lint and `tsc --noEmit` clean on
  both apps.

### Business-rule assumption flagged (please confirm)
Amadeus Self-Service is stateless — `Flight Offers Price` needs the *full*
offer payload back, not just an id, but CLAUDE.md/the brief fix
`priceOffer(offerId)` as the interface signature. To honor that signature
without leaking raw GDS payloads to the rest of the app, `AmadeusModule`
caches each raw offer in Redis keyed by a generated UUID when `searchFlights`
returns it, and `priceOffer(offerId)` looks it up. Offer cache TTL is
**900 seconds (15 min)**, configurable via `AMADEUS_OFFER_CACHE_TTL_SECONDS` —
this number is a guess, not something Amadeus guarantees; tune it once we see
real sandbox fare volatility. If an offer has expired or was never cached,
`priceOffer` throws `OfferExpiredError` (Phase 2's search/booking module
should catch this and tell the customer to re-search).

### Not done in Phase 1 (by design, per the phase plan)
- `createOrder` / `issueTicket` / `getOrder` are implemented as stubs that
  throw `GdsNotImplementedError` — real implementation is Phase 5.
- No HTTP controller for search yet (Phase 2 builds the search endpoint that
  calls `AmadeusService.searchFlights`).
- No Prisma domain models yet (Booking/Payment/AuditLog arrive in later
  phases, per CLAUDE.md).

### Open questions / blockers for you
1. **Docker isn't installed on this machine** — I wrote `docker-compose.yml`
   and it looks correct, but I have not been able to run it or verify
   Postgres/Redis connectivity end-to-end. Please install Docker Desktop and
   run `npm run docker:up`, then confirm `GET /health` and Prisma/Redis
   connections work.
2. **No Amadeus sandbox credentials yet** — register at
   developers.amadeus.com and put `AMADEUS_CLIENT_ID` /
   `AMADEUS_CLIENT_SECRET` in `apps/api/.env`. Until then, `/health` will
   report the Amadeus indicator as down, and `searchFlights`/`priceOffer`
   will throw `AmadeusAuthError`.
3. **No Stripe test keys yet** — not a Phase 1 blocker, but needed before
   Phase 4.
4. Confirm the offer-cache TTL assumption above.

## Phase 2 onward — not started
Search UI, search endpoint + Redis result caching, re-pricing UX, booking
funnel, Stripe, order creation/ticketing, admin, hardening — all per the
original phase plan. Waiting for your go-ahead to start Phase 2, plus
resolution of the open items above (at least Docker; Amadeus/Stripe keys can
follow later in their respective phases).
