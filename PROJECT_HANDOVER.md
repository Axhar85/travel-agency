# Project Handover

**Start here.** This is the entry point for a Claude session (or any
developer) resuming this project after a pause. Written 2026-10-27 as the
user paused development indefinitely and may return with a new Claude model
in a brand-new conversation.

## Purpose and audience

A flight booking website for an IATA-accredited travel agency based in
Madrid, Spain ("Al-Naafi Travels," formerly "Malik Travel Booking" in
infrastructure naming — see [DECISIONS.md](DECISIONS.md)), serving customers
booking flights to Pakistan, India, Bangladesh, the Philippines, Latin
America, and Hajj & Umrah pilgrims. The site is being built by the user
(non-technical) in collaboration with Claude, for an actual friend's
business — not a personal project. This is a **real commercial app intended
to eventually handle live payments and real bookings**; it has been treated
with that level of care throughout (PCI scope discipline, no secrets in
logs, idempotent payment mutations) even while still in sandbox/dev mode.

## Where things stand, in one paragraph

The site works end-to-end as a *demo* with no live flight data: search UI,
booking funnel, Stripe payment UI, customer accounts, and a full
non-technical admin CMS (4 content modules) are all built and tested. What's
missing is the thing the whole site is for — nothing has ever searched a
real flight, because no GDS (Amadeus or Travelport) has usable credentials
yet. A multi-provider aggregation layer was just finished so the app can
search Amadeus and Travelport (Galileo) together once either has
credentials, with explicit handling for the agency's private/ethnic fares.
Order creation and real ticketing were never started at all.

## Documents in this handover

| Document | What's in it |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, directory/module map, auth, deployment topology |
| [FEATURE_STATUS.md](FEATURE_STATUS.md) | Every feature, one status each, with caveats |
| [API_INTEGRATIONS.md](API_INTEGRATIONS.md) | Amadeus, Travelport, Stripe, Vercel Blob — what's real, what's a stub |
| [DECISIONS.md](DECISIONS.md) | Why things were built this way; what was deliberately not built |
| [NEXT_STEPS.md](NEXT_STEPS.md) | **Read before changing anything.** Exact resume point, known bugs, recommended next task |
| [CLAUDE.md](CLAUDE.md) | Short persistent instructions for Claude Code sessions (local-only, gitignored — see below) |
| [RESUME_PROMPT.md](RESUME_PROMPT.md) | Paste-able prompt to start a brand-new conversation |
| `README.md` | Human setup instructions (tracked in git, kept current) |
| `PROGRESS.md` | Full phase-by-phase build narrative — far more detail than this handover; **local-only, see below** |

This handover deliberately does not repeat `PROGRESS.md`'s level of detail —
treat `PROGRESS.md` as the deep archive and these files as the fast-load
summary.

## ⚠️ Local-only files — read before cancelling anything

`PROGRESS.md` and `CLAUDE.md` at the repo root are in `.gitignore` and have
**never been pushed to GitHub**. They exist only on this machine. Everything
in *this* handover package is new content, not yet committed either — see
[NEXT_STEPS.md](NEXT_STEPS.md) for the recommended action before this
machine/subscription state is lost.

## Completed work (high confidence, tested)

Flight search UI, booking session flow, Stripe payment UI (manual capture),
customer accounts, 4-module admin CMS with image upload, bilingual (ES/EN)
site throughout, SEO basics, cookie consent, and — most recently — a
provider-agnostic GDS aggregation layer (Amadeus + Travelport) with
fare-aware de-duplication. 204 backend tests exist, 200 pass (4 failures are
a known, already-diagnosed, already-fixed-but-uncommitted issue — see
[NEXT_STEPS.md](NEXT_STEPS.md)).

## Outstanding work (high level — full detail in linked docs)

No real GDS credentials (Amadeus's free tier no longer exists; Travelport
trial credentials haven't been requested yet). No order creation/ticketing.
Hotels, Travel Insurance, Hajj/Umrah packages, Visa Services not started.
Newsletter signup is a non-functional placeholder. Production deployment
hasn't been re-verified since the last session that touched it.

## Overall progress

Roughly: **foundation, search UI, booking funnel, and payments UI are done;
the integrations that make any of it real are not.** See
[FEATURE_STATUS.md](FEATURE_STATUS.md) for the itemized breakdown.
