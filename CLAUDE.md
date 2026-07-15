# Malik Travel Booking Platform

## What this is
Flight booking website for an IATA-accredited travel agency (Madrid, Spain).
Real commercial app: eventually handles live payments and real bookings — treat
security and data integrity as first-class even during sandbox/dev.

## Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- DB: PostgreSQL via Prisma
- Cache/sessions: Redis
- Payments: Stripe (Payment Intents + Elements), 3DS2/SCA required for EU cards
- GDS: Amadeus — **currently Self-Service REST APIs (sandbox)**. Enterprise/Web
  Services (SOAP, PCC-based) will replace booking/ticketing later. See
  "Amadeus swap plan" below — this is the single most important architectural
  constraint on this project.

## Amadeus swap plan (read this before touching AmadeusModule)
- All Amadeus calls go through `AmadeusModule` behind a GDS-agnostic interface:
  `searchFlights()`, `priceOffer()`, `createOrder()`, `issueTicket()`, `getOrder()`
- Nothing outside `AmadeusModule` may assume REST-specific response shapes
- Config flag `AMADEUS_MODE` controls implementation (`self-service` now,
  `enterprise` later) — swapping should mean a new implementation behind the
  same interface, not a rewrite of booking/passenger/payment code
- Self-Service `Flight Create Orders` has real production limits (mostly
  NDC/LCC content). This is expected for now — full traditional GDS ticketing
  arrives with the Enterprise swap

## Build & run
- `npm run dev` — start frontend + backend
- `npm run test:amadeus` — AmadeusModule tests (sandbox)
- `npm run test:payments` — Stripe flow tests
- Run tests before marking any phase complete

## Non-negotiable rules
- Card/payment data never touches the backend unencrypted or untokenized —
  Stripe tokens only, PCI SAQ A scope
- All secrets via env vars / secrets manager — never hardcoded, logged, or
  committed
- All user input validated server-side regardless of client-side validation
- No PII (passport numbers, full card info) in logs or error monitoring
- Auth required on all admin/back-office routes
- Every payment/booking mutation must be idempotent and auditable
- Authorize payment before calling `createOrder()`; auto-void on booking failure

## Conventions
- TypeScript everywhere, strict mode
- One module per domain (search, booking, payments, admin) — no cross-module
  reach-arounds; go through the module's exported interface
- Tests required for `AmadeusModule` and payment flow specifically — these are
  the two places a silent bug costs real money

## Current status
See `PROGRESS.md` for phase-by-phase status — read it at the start of every
session before doing anything else.

## Working style
- Flag business-rule assumptions (e.g. auto-ticket vs. manual review) instead
  of guessing silently
- Explain architecture decisions that affect the future Enterprise/SOAP swap
- Update `PROGRESS.md` before ending a session: what's done, what's next,
  open questions