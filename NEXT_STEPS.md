# Next Steps

**Read this file before making any changes.** Last updated 2026-10-27 at the
point development was paused (user cancelling their Claude subscription,
possibly returning in months with a new model/conversation).

## ⚠️ Time-sensitive loose end — handle this first

A background task was asked to fix 4 failing tests (stale hardcoded dates in
`apps/api/src/search/dto/search-flights-query.dto.spec.ts` — see "Known bugs"
below). **It made the fix but never committed it.** The fix sits as an
uncommitted working-tree change in a separate git worktree:

```
C:\claude\travel-agency\.claude\worktrees\funny-perlman-693b3e
```

on local branch `claude/funny-perlman-693b3e` (which is otherwise identical
to `main` — no other changes). Before doing anything else:

```bash
cd "C:\claude\travel-agency\.claude\worktrees\funny-perlman-693b3e"
git status                 # confirm the modified file is still there
git diff                   # review the fix
```

If it looks correct, either commit it on that branch and open a PR, or
re-apply the same fix directly on `main`/a fresh branch and discard the
worktree. **If this worktree directory is ever deleted (e.g. a workspace
cleanup) without committing first, this fix is lost** and the same 4 tests
will need re-fixing from scratch (not hard — see "Known bugs" below for
exactly what's wrong).

## What was completed most recently

Multi-GDS aggregation: Amadeus + Travelport (Galileo) searched together
behind one normalized format, with fare-type-aware de-duplication so ethnic/
private fares are never merged into published ones. Merged to `main` via PR
#12 (commit `8d8864a`). Full detail in [API_INTEGRATIONS.md](API_INTEGRATIONS.md)
and [DECISIONS.md](DECISIONS.md). This was itself triggered by discovering
Amadeus's free Self-Service portal was shut down (2026-07-17), which broke
the project's original "sandbox now, Enterprise later" plan.

Before that, in the same working session: a "Special offers" (Promo Cards)
homepage section, desktop-vertical destination cards, an IATA-accreditation
trust text block, and a rebrand to "Al-Naafi Travels."

## What remains unfinished

In roughly the order a returning session would hit them:

1. **The uncommitted test fix above** — do this first, it's at risk of being lost.
2. **Travelport search/price mapping** — needs real trial credentials (self-serve at `my.travelport.com/v2/get-trial`) and a real response sample before the mapper can be written. See [API_INTEGRATIONS.md](API_INTEGRATIONS.md#travelport-galileo).
3. **Amadeus credentials** — blocked on the agency going through Amadeus's Enterprise onboarding (no more free signup). Blocks live verification of search, booking, and payment end-to-end.
4. **Ethnic/private fare business rules** — open questions for the agency owner, listed in [API_INTEGRATIONS.md](API_INTEGRATIONS.md#ethnic--private-fares--business-rules-still-unknown). Needed before the fare-classification logic can be trusted beyond "doesn't silently merge."
5. **Order creation / ticketing (Phase 5)** — `createOrder()`/`issueTicket()`/`getOrder()` are stubs on every provider. Never started. This is the single biggest remaining chunk of real work.
6. **Newsletter signup** — currently fake (see [FEATURE_STATUS.md](FEATURE_STATUS.md)). Decision needed: Mailchimp/Brevo vs. self-built.
7. **Hotels, Travel Insurance** — not started. Amadeus also offers APIs for both; discussed as a likely bundle into the same Enterprise relationship, not decided.
8. **Hajj & Umrah full packages** — needs a Saudi ground-operator partnership + Nusuk platform registration. Not a code task.
9. **Production deployment re-verification** — was working as of the last time it was touched (per conversation; not re-verified this session, no deploy config files exist in-repo to check against — see [ARCHITECTURE.md](ARCHITECTURE.md#deployment)).

## Known bugs and technical debt

- **4 failing tests, root cause known, fix exists but is uncommitted** (see the time-sensitive section above). Root cause: `search-flights-query.dto.spec.ts` hardcodes `departureDate: '2026-08-01'` and related dates as fixture literals; the DTO's own `IsTodayOrFuture` validator correctly rejects them once that date is in the past (it now is). Not a code bug — a test-fixture time bomb. Fix approach: build fixture dates relative to `new Date()` instead of hardcoding them.
- **Widespread CRLF/prettier lint noise.** `npx eslint "src/**/*.ts"` in `apps/api` currently reports ~19 prettier formatting errors spread across many files that were never touched this session (`account/`, `destination-cards/`, `hero-slides/`, etc.) — almost certainly line-ending drift (CRLF vs LF) from editing on Windows, not real logic errors. Two genuine (non-formatting) errors also exist in `account/account.service.spec.ts`: `@typescript-eslint/no-unnecessary-type-assertion` at two lines — pre-existing, not introduced this session. Not fixed as part of this handover (documentation-only task). A single `npx eslint "src/**/*.ts" --fix` run would likely clear most of it; review the diff before trusting it blindly.
- **`apps/api/.env` has stray compiled artifacts** (`prisma/seed.js`, `prisma/seed.d.ts`, `scripts/hash-admin-password.js`, etc.) sitting as untracked files in the working tree — leftover from an old build before `tsconfig.json`'s `rootDir`/`include` were fixed. Harmless (gitignored or simply untracked, never committed) but visible in `git status`. Safe to delete if they're annoying; not required.
- **`BLOB_READ_WRITE_TOKEN` and `STRIPE_WEBHOOK_SECRET` are empty** in the local `apps/api/.env` as of this audit. Image uploads in the admin CMS and Stripe webhook delivery won't work locally until these are set. (Production values, if set, live only in Render's dashboard — not verifiable from here.)
- **`PROGRESS.md` and `CLAUDE.md` at the repo root are gitignored — local-only, never pushed to GitHub.** If this machine's local files aren't preserved, the detailed phase-by-phase build log in `PROGRESS.md` (57KB of history, much of it not duplicated anywhere else) is gone. **Recommended before stepping away: either back up this local project folder somewhere durable, or explicitly ask a future Claude session to commit `PROGRESS.md`/`CLAUDE.md` to git** (this was a deliberate pre-existing repo convention — not changed without being asked, see [DECISIONS.md](DECISIONS.md) for why it wasn't touched here).

## Recommended next task (when development resumes)

**Commit the uncommitted DTO-date-fix** (5 minutes), then **request Travelport
trial credentials** and **implement the Travelport search/price mapper**
against a real response. This is the highest-leverage next step because:
- It's self-serve (no waiting on Amadeus's Enterprise sales process)
- It unblocks live verification of search → booking → payment end-to-end for the first time in this project's history (currently nothing has ever been tested against real flight data)
- It's the natural continuation of the most recent work, with full test coverage already in place for everything around it

### Acceptance criteria
- `TravelportClient.searchFlights()` returns real, normalized `FlightOffer[]` from a live pre-production Travelport search, with `provider: 'travelport'` and (where Travelport's response allows) `fare` populated
- `TravelportClient.priceOffer()` works end-to-end for at least one real offer
- `GET /health` reports `travelport: up` with real credentials configured
- Existing `gds.service.spec.ts` / `dedupe-offers.spec.ts` guarantees still pass (private fares never merged away) once real Travelport fare-type data flows through
- A full search with `GDS_PROVIDERS=amadeus,travelport` returns results even if only Travelport has credentials (Amadeus still gracefully reports down)

### Suggested implementation order
1. Request Travelport trial credentials, set the four `TRAVELPORT_*` env vars locally
2. Confirm `GET /health` shows `travelport: up` (proves auth works with real creds, not just the fake-credential 401 already verified)
3. Make one real `POST /air/catalog/search/catalogproductofferings` call (via curl/Postman, using Travelport's own DevKit Postman collection) and save a real response as a fixture
4. Write `TravelportResponseTypes` + a mapper against that real fixture (mirror `apps/api/src/amadeus/self-service/amadeus.mapper.ts`'s structure)
5. Implement `TravelportClient.searchFlights()`/`priceOffer()` for real, with unit tests against the fixture
6. Manually verify a live search locally with both providers enabled
7. Only then consider `GDS_PROVIDERS=amadeus,travelport` in any deployed environment

## Commands to verify the project is still in a good state

```bash
# From repo root
npm install                              # if node_modules is stale/missing

# Backend
cd apps/api
npx tsc --noEmit -p tsconfig.json        # should be clean
npx eslint "src/**/*.ts"                 # expect ~19 pre-existing prettier errors, see "Known bugs"
npx jest                                 # expect 200/204 passing (4 known failures, see above)

# Frontend
cd ../web
npx tsc --noEmit                         # should be clean
npx eslint .                             # should be clean
npx next build                           # should succeed (this is the check that catches real deploy failures)

# Full local run (needs Docker Desktop running first)
cd ../..
npm run docker:up
cd apps/api && npx prisma migrate dev && cd ../..
npm run dev                              # frontend :3000, backend :4000
```

As of 2026-10-27: tsc/lint/build all pass as described above. Docker was
**not running** during this audit, so local Postgres/Redis were not
live-verified (same gap noted repeatedly in `PROGRESS.md` throughout the
project's history — this machine's Docker Desktop needs manual restarting
fairly often).
