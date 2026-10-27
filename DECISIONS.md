# Decisions

A condensed log of *why*, not *what was built* (see `PROGRESS.md` — local
only, see [NEXT_STEPS.md](NEXT_STEPS.md) — for the full build narrative).
Newest first within each section isn't maintained; read top to bottom as a
rough timeline.

## Architecture

- **GDS-agnostic interface from day one.** `GdsClient` (`searchFlights`,
  `priceOffer`, `createOrder`, `issueTicket`, `getOrder`) was designed before
  Travelport existed, specifically so a second provider could be added
  without touching booking/payment code. This paid off exactly as intended —
  adding Travelport changed `search.module.ts`/`booking.module.ts` by one
  import line each.
- **Offer ids are now `<provider>.<native-id>`, with bare ids still routing
  to Amadeus.** Alternative considered: require all offer ids to be
  provider-prefixed. Rejected — would have broken any in-flight booking
  session or cached search result across the deploy that introduced
  multi-provider support.
- **Fare de-duplication never merges on an unknown or mismatched fare
  classification.** Could have merged on flights+price alone (simpler).
  Rejected explicitly because the agency holds private/ethnic fares that must
  never be silently hidden behind a published fare — see
  [API_INTEGRATIONS.md](API_INTEGRATIONS.md).
- **Travelport's search/price were deliberately left as stubs** rather than
  mapped from documentation alone. Travelport's response is a nested
  reference structure (offers point into a shared `ReferenceList`); mapping
  it without ever having seen a real response was judged too likely to be
  wrong in ways that wouldn't surface until real data arrived.
- **Booking-in-progress state lives in a Redis-backed session cookie, not a
  DB row**, until payment resolves. Matches an explicit early brief
  requirement ("Redis-backed session state, not just client state") and
  keeps passport numbers out of browser-accessible JS state.
- **No shared types package between `apps/web` and `apps/api`.** Frontend
  hand-maintains a mirror of backend types in `apps/web/lib/types.ts`.
  Accepted as fine at this size; flagged as worth revisiting if the two
  drift — they have not needed reconciliation so far since both sides are
  touched together whenever a type changes.
- **`PrismaService` does not crash the app if Postgres is unreachable at
  boot.** Logs and continues; Prisma connects lazily on first real query.
  Means a down Postgres is invisible until something actually queries it —
  accepted tradeoff over taking down the entire app (including the Amadeus
  health check and anything else that doesn't need the DB) over a DB outage.
- **Session cookie `sameSite` is `lax` locally, `none` in production** (with
  `secure: true`, which Render/Netlify provide via HTTPS termination).
  Required because the real deployment puts frontend (Netlify) and backend
  (Render) on different registrable domains — genuinely cross-site, not just
  cross-port like local dev.
- **Payments use manual capture, not automatic.** Directly required by the
  project's own non-negotiable rule ("authorize payment before calling
  `createOrder()`; auto-void on booking failure") — automatic capture can't
  be cleanly voided once money has moved. Current terminal state is "payment
  authorized, awaiting ticketing," not "paid."
- **`PaymentRecordRepository` is keyed by Stripe PaymentIntent id, not
  booking session id.** Stripe's webhook has no session cookie to act
  through — this is the only record both the webhook and the cookie-bound
  booking endpoints can agree on.

## Product / scope

- **"My Bookings" only claims `payment_authorized`/`payment_failed`, never
  "confirmed" or "ticketed."** Ticketing isn't implemented, so claiming
  otherwise would be dishonest to the customer.
- **No email verification or password reset for customer accounts** — no
  email-sending infrastructure exists anywhere in the project. Explicitly
  deferred as "needs a separate integration decision first," same category
  as the Amadeus/Stripe/Blob choices were.
- **Newsletter signup form is intentionally UI-only right now, not secretly
  broken** — built as a visible placeholder while the real decision (self-host
  subscriber storage + bulk email vs. use Mailchimp/Brevo) was still open.
  Recommendation given: use an existing email marketing tool rather than
  build bulk-email infrastructure from scratch. Not decided or built.
- **Hajj & Umrah full packages (not just flights) are explicitly NOT a GDS
  integration problem.** Requires an actual business partnership with a
  Saudi ground operator plus Nusuk platform registration for visas. Flagged
  clearly so this isn't mistaken for "just another API to wire up."
- **Amadeus's free Self-Service portal shutdown (2026-07-17) changed the
  original plan.** The project was originally scoped as "Self-Service sandbox
  now, Enterprise/SOAP swap later" (see the old `AMADEUS_MODE` flag). That
  free first step no longer exists; Amadeus access now requires their
  Enterprise onboarding regardless. Travelport was added partly *because* it
  still offers free trial credentials, giving a path to test the
  multi-provider code for real before Amadeus Enterprise access exists.
- **Ethnic/private fare business rules were explicitly left as open
  questions for the agency**, not guessed at: how they're accessed (PCC,
  account codes, net fares), who's eligible, markup vs. commission, which PCC
  must ticket. See [API_INTEGRATIONS.md](API_INTEGRATIONS.md).

## Explicitly rejected / deferred

- **A real third-party CMS (e.g. Sanity)** — rejected in favor of the
  existing hand-built admin panel, which already does everything a
  non-technical owner needs (upload images, edit bilingual text, reorder,
  show/hide) at zero subscription cost, already wired into the same
  codebase. Would only be reconsidered if the owner wants to hand content
  control to someone outside this codebase entirely.
- **Git history rewriting / secret scrubbing before any ownership
  transfer** — a full history scan (2026-08) found no real secrets ever
  committed (only a harmless local-Docker-only default password in
  `.env.example`), so `git log` history was judged clean; a plain GitHub
  "Transfer repository" was recommended over rewriting history, should
  ownership ever move to the business owner directly.
- **Drag-and-drop reordering in the admin CMS** — plain up/down buttons used
  instead, a deliberate simplification for "a handful of images," not a cut
  corner.
- **A country-picker dropdown for nationality/passport issuing country** —
  plain 2-letter text inputs instead. Noted as a UX nice-to-have, not a
  functional gap.
- **Fine-grained passenger-type-vs-age cross-checking** (e.g. rejecting an
  INFANT with a birthdate implying age 5) — only format/past-date validation
  exists. Flagged as a known simplification.
