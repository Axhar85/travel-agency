# API Integrations

See [ARCHITECTURE.md](ARCHITECTURE.md) for how these fit into the backend's
module structure. Never put real keys/secrets in this file or any other
tracked file — see `README.md`'s "Never paste a real API key..." rule.

## Flight data: Amadeus + Travelport (Galileo)

Both are accessed through one internal abstraction so the rest of the app
never sees provider-specific shapes:

```
apps/api/src/gds/interfaces/gds-client.interface.ts
```

`GdsClient` interface: `searchFlights()`, `priceOffer()`, `createOrder()`,
`issueTicket()`, `getOrder()`. Normalized `FlightOffer` carries `provider`
(`"amadeus" | "travelport"`) and an optional `fare: { type: "PUBLISHED" |
"PRIVATE", basisCodes: string[] }` — see "Ethnic fares" below for why.

`GdsService` (`apps/api/src/gds/gds.service.ts`) is the single entry point
the rest of the app (`search/`, `booking/`) injects — never a concrete
provider client. It:
- Fans a search out to every provider listed in `GDS_PROVIDERS` in parallel, with a per-provider timeout (`GDS_SEARCH_TIMEOUT_MS`, default 12s)
- Tolerates partial failure — one provider down still returns the other's fares
- Never caches a partial result (so a recovered provider isn't hidden for the cache TTL)
- Routes `priceOffer`/`createOrder`/`issueTicket`/`getOrder` back to the right provider via a `<provider>.<native-id>` offer id (e.g. `amadeus.abc123`); a bare legacy id (no prefix) routes to Amadeus
- De-duplicates identical fares across providers (same flights + same **known** fare type + same fare basis codes + same currency → keep the cheaper one). **Never merges when the fare type is unknown, differs, or currencies differ** — see "Ethnic fares" below.

### Amadeus

| | |
|---|---|
| Status | **Partially working.** Auth + search + price implemented and tested against the Self-Service REST API shape. **No credentials configured** (`AMADEUS_CLIENT_ID`/`AMADEUS_CLIENT_SECRET` empty in `apps/api/.env` as of this audit) — `GET /health` reports Amadeus down, search/price throw a safe "temporarily unavailable" error. |
| Auth | OAuth2 client-credentials flow, token cached with a 60s expiry safety margin (`apps/api/src/amadeus/self-service/amadeus-auth.service.ts`) |
| Implemented | `searchFlights` (Flight Offers Search v2), `priceOffer` (Flight Offers Price v1) |
| Not implemented | `createOrder`, `issueTicket`, `getOrder` — all throw `GdsNotImplementedError` (Phase 5, never started) |
| Fare classification | Reads `pricingOptions.fareType` from the raw response: `PUBLISHED` → `PUBLISHED`, anything else → `PRIVATE`. Fare basis codes pulled from `travelerPricings[].fareDetailsBySegment[].fareBasis`. **Unverified against a real response** — this was written from Amadeus's documented shape, not confirmed live (no credentials to test with). |
| **Critical fact** | **Amadeus's free Self-Service developer portal was shut down 2026-07-17** (verified by browsing developers.amadeus.com on 2026-08-04). The site is now Enterprise-only, sales-assisted ("Request access"). The `AMADEUS_MODE=self-service` config value still refers to the REST API *shape* this code was built against — it does not mean free/instant signup is still available. Getting real credentials now requires Amadeus's Enterprise onboarding process. |
| Source files | `apps/api/src/amadeus/` (module, service, health indicator, `self-service/` subfolder, `errors/`) |

### Travelport (Galileo)

| | |
|---|---|
| Status | **Auth only.** `searchFlights`/`priceOffer`/`createOrder`/`issueTicket`/`getOrder` all throw `GdsNotImplementedError` *before* any network call — deliberate placeholder, not a bug. `GdsService` treats this as "skipped" (not "failed"), so enabling `travelport` in `GDS_PROVIDERS` today is harmless and changes nothing about Amadeus-only behavior. |
| Auth | Real, documented, and tested (`apps/api/src/travelport/travelport-auth.service.ts`): `grant_type=password` + `username`/`password`/`client_id`/`client_secret` (all four issued together by Travelport), POST to `https://auth.pp.travelport.net/oauth/token` (pre-production, default) or `https://auth.travelport.net/oauth/token` (production, via `TRAVELPORT_ENV`). Token cached ~24h, refreshed 5 min early. Verified against the **real** pre-production endpoint with fake credentials on 2026-09-25: returned HTTP 401 (request format accepted, login correctly rejected). No credential appeared in any log. |
| Not implemented | Everything past auth. Travelport's Search response (`POST /air/catalog/search/catalogproductofferings`) is a deeply nested reference structure — offers point into a shared `ReferenceList` of flights/products/brands/fares, not a flat list. **Deliberately not mapped without a real response sample** — writing that mapper from documentation alone would be guessing at a shape this project has never seen live. |
| Credentials status | **None configured.** `TRAVELPORT_CLIENT_ID`/`_SECRET`/`USERNAME`/`PASSWORD` all empty. Trial credentials: request at `https://my.travelport.com/v2/get-trial` (self-serve, arrive by email — confirmed available as of 2026-09-25, unlike Amadeus). |
| Source files | `apps/api/src/travelport/` (module, auth service, client stub, health indicator, `errors/`) |
| Reference docs read | `developer.travelport.com/docs/getting-started`, `.../docs/getting-started/authentication`, `.../docs/flights/guides/flights-search-guide`, `.../apis/flights/searches/createairsearch` (all read 2026-09-25 — re-check for changes before implementing, API docs sites change) |

### GDS provider switch

`GDS_PROVIDERS` env var (default: `amadeus` only — adding Travelport code
changed nothing for any existing environment until explicitly opted in).
Comma-separated, order = merge order. Validated at boot
(`apps/api/src/gds/enabled-providers.ts`) — an unknown provider name or empty
list fails startup with a clear message, not a silent no-op.

### Ethnic / private fares — business rules still unknown

**The agency uses both Amadeus and Galileo day to day and holds "ethnic"
(community/diaspora) fares for some destinations on some airlines** — stated
by the user directly, not inferred. The code's only guarantee so far: a fare
marked `PRIVATE` (or unclassified) is **never** merged into or hidden behind
a `PUBLISHED` fare on the same flights by the de-duplication logic
(`apps/api/src/gds/dedupe-offers.ts`, tests in
`dedupe-offers.spec.ts` encode this explicitly).

**What is NOT yet known** (ask the agency before building further):
- How are these fares actually accessed — specific PCC, account codes, ticket designators, or net/consolidator fares?
- Who is eligible to buy them (nationality/community checks)?
- Are they net (agency adds markup) or commissionable?
- Must a specific PCC issue the ticket?
- On Travelport specifically, the credentials' access group/PCC determines which private fares a call can even see — so production credentials must be provisioned against the PCC holding these deals, which is a business/contractual step with Travelport, not a code change.

## Payments: Stripe

| | |
|---|---|
| Status | **Built and partially verified.** Test-mode keys were added and confirmed live (`GET /health` reported `stripe: up`, confirming `StripeHealthIndicator`'s `balance.retrieve()` call authenticated) in a past session. **Not verified**: the actual card-entry/3DS-challenge/webhook-driven flow through the real UI, because reaching `/booking/payment` requires a booking session, which requires `priceOffer()` to succeed first — blocked by the missing Amadeus credentials (chicken-and-egg: Travelport trial credentials could unblock this once its search/price methods are implemented). |
| Auth | Standard Stripe secret/publishable key pair, both set (presence confirmed, values not inspected) |
| Mode | **Manual capture** (`capture_method: 'manual'`) — deliberate: the project's non-negotiable rule is "authorize payment before calling `createOrder()`; auto-void on booking failure," which only works cleanly against an uncaptured authorization. Current terminal state is "payment authorized, awaiting ticketing" — nothing is ever actually captured yet, since `createOrder()` doesn't exist. |
| Implemented | `POST /payments/intent` (idempotent — reuses an open intent, starts fresh after cancel/fail), `POST /payments/webhook` (raw-body signature verification), `StripeService.capturePaymentIntent`/`cancelPaymentIntent` (defined, never called — primitives for Phase 5) |
| Not implemented | Actual capture-on-ticketing-success / void-on-failure wiring (needs real `createOrder()` first) |
| Not configured | `STRIPE_WEBHOOK_SECRET` — empty. Needs the Stripe CLI (`stripe listen --forward-to localhost:4000/payments/webhook`) running locally to get a real value, or the dashboard's webhook config in production. |
| 3DS2/SCA | Handled via Stripe Elements' `PaymentElement` + `confirmPayment({redirect: 'if_required'})` — stays in-page when Stripe can avoid a full navigation |
| Source files | `apps/api/src/payments/` |

## Image storage: Vercel Blob

| | |
|---|---|
| Status | **Code complete, credential status unverified in this audit** (`BLOB_READ_WRITE_TOKEN` was confirmed empty in an earlier session; not re-checked here since local `.env` currently shows it empty — see note below). |
| Used by | All four CMS modules (`promotions`, `hero-slides`, `destination-cards`, `promo-cards`) — `multer` memory storage (5MB cap, no mimetype allowlist beyond the browser's own `accept="image/*"` file picker) uploads directly to Vercel Blob server-side. |
| Get it from | Create a Blob store at vercel.com (works independently of where the app is hosted) |

## Not integrated at all (menu items exist, nothing behind them)

Hotels, Holidays, Travel Guide, Visa Services, Airport Transfers, Extra
Baggage, Travel Insurance — all show as real nav links/service tiles but
resolve to `/coming-soon` or an honest "not started" state. No API has been
chosen for any of these. See [NEXT_STEPS.md](NEXT_STEPS.md) for what was
discussed about Hotels/Insurance possibly bundling into the same Amadeus
Enterprise relationship, and Hajj/Umrah *packages* (as opposed to just
flights) needing a Saudi ground-operator partnership + Nusuk platform
registration — not an API integration at all.
