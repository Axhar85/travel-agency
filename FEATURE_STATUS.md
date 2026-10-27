# Feature Status

Statuses: **COMPLETE** (built, tested, verified working), **PARTIAL** (built
but with known gaps), **NOT STARTED**, **BLOCKED** (code done, waiting on an
external dependency — usually credentials), **NEEDS VERIFICATION** (code
exists and passes unit tests, but has never been exercised against real
upstream data/credentials).

See [API_INTEGRATIONS.md](API_INTEGRATIONS.md) and
[ARCHITECTURE.md](ARCHITECTURE.md) for detail behind any row.

| Feature | Status | Notes |
|---|---|---|
| Flight search (UI + backend) | **NEEDS VERIFICATION** | Fully built (search form, autocomplete, results, sort/filter, re-pricing) and unit-tested. Never run against real flight data — no GDS credentials configured. Degrades gracefully to a translated "temporarily unavailable" message. |
| Multi-GDS aggregation (Amadeus + Travelport) | **PARTIAL** | Aggregation/routing/de-dupe layer is complete and tested (58 tests). Amadeus provider is implemented but has no credentials. Travelport provider has working auth only — search/price are stubs. |
| Ethnic/private fare handling | **PARTIAL** | De-duplication logic guarantees private fares are never merged away — tested. The actual business rules (eligibility, PCC, net vs. commission) are unknown — see [API_INTEGRATIONS.md](API_INTEGRATIONS.md#ethnic--private-fares--business-rules-still-unknown). |
| Booking flow (passenger details, review) | **NEEDS VERIFICATION** | Built, tested with mocks, integration-tested for session persistence across requests. Never reached with real search data (blocked upstream by GDS credentials). |
| Payment (Stripe, card entry, 3DS) | **NEEDS VERIFICATION** | Stripe test keys confirmed live via health check in a past session. The actual card-entry/3DS UI flow has never been exercised — blocked because reaching the payment page requires a real booking session, which requires GDS search to succeed first. |
| Order creation / ticketing | **NOT STARTED** | `createOrder()`/`issueTicket()`/`getOrder()` are stubs on every provider. This is "Phase 5" in the original plan and was never begun. Nothing in this app has ever issued a real ticket. |
| Customer accounts (register/login/bookings) | **COMPLETE** | Register, login, logout, "My Bookings" history. Verified live in a past session (registered an account, confirmed session state across navigation). No email verification or password reset (no email-sending infrastructure exists at all — deliberate scope cut). |
| "My Bookings" history | **PARTIAL by design** | Only records bookings that reached `payment_authorized`/`payment_failed` — deliberately does not claim "confirmed" or "ticketed," since that's not implemented. |
| Admin panel — auth | **COMPLETE** | Single shared bcrypt-hashed password, rate-limited login, session-gated routes. Verified live (login succeeds/fails correctly). |
| Admin CMS — Promotions | **COMPLETE** | Horizontal banner, simple data model (optional title/link). Upload/reorder/show-hide/delete all built and route-tested. |
| Admin CMS — Hero Carousel | **COMPLETE** | Bilingual title/subtitle fields, same CRUD pattern as Promotions. |
| Admin CMS — Destination Cards | **COMPLETE** | Vertical layout on desktop (deliberate change from an earlier landscape design), unchanged on mobile. |
| Admin CMS — Promo Cards | **COMPLETE** | Newest of the four CMS modules — separate feed from Promotions, same visual treatment as Destination Cards. Homepage section order: Special offers → short IATA/trust text block → Popular destinations. |
| Image upload (all 4 CMS modules) | **COMPLETE, credential status unverified this audit** | Code is identical/proven across all four modules. `BLOB_READ_WRITE_TOKEN` was empty as of the last check in this audit — confirm before relying on uploads working. |
| Multilingual support (ES/EN) | **COMPLETE** | Spanish primary/default, English secondary. All built pages have both locales; `next build` produces static pages for both. |
| SEO (sitemap, robots, metadata) | **COMPLETE** | `app/sitemap.ts`, `app/robots.ts`, per-page `generateMetadata`, hreflang alternates, `noindex` on private pages (admin/account/booking/search). |
| Cookie consent banner | **COMPLETE** | localStorage-based (not a paid CMP), "Accept all" / "Necessary only", links to a real (non-fabricated) cookie policy page. |
| Newsletter signup | **NOT STARTED (looks functional, is not)** | The footer "Subscribe" form exists visually but its submit handler only sets local React state — the email is never sent anywhere, never stored, no backend endpoint exists. Discussed: recommended wiring it to Mailchimp/Brevo rather than building subscriber storage + bulk email from scratch, not yet decided or built. |
| Hotel booking | **NOT STARTED** | Nav link exists, resolves to `/coming-soon`. No API chosen. Amadeus also offers a Hotel API — discussed as the likely path to bundle into the same Enterprise relationship, not decided. |
| Travel insurance | **NOT STARTED** | Same as Hotels — nav link only. Amadeus also lists an Insurance API; discussed, not decided. |
| Hajj & Umrah — flights | **COMPLETE** (same caveat as flight search above) | Real content page, pre-filled search toward Jeddah/Madinah. Shares the same GDS-credential blocker as general flight search. |
| Hajj & Umrah — full packages (hotel+transport+guide+visa) | **NOT STARTED, and NOT a GDS integration** | Explicitly identified as requiring a Saudi ground-operator business partnership plus registration on Saudi Arabia's Nusuk platform for visa processing — not something solved by any API. |
| Visa services, airport transfers, extra baggage | **NOT STARTED** | Nav/service tiles exist as honest placeholders only. |
| Deployment (Render + Netlify + Neon + Upstash) | **NEEDS VERIFICATION** | Was live and working as of the last session that touched it (per conversation history — see [ARCHITECTURE.md](ARCHITECTURE.md#deployment)). Not re-verified in this audit; no deployment config files exist in the repo to check against. |
| Test suite | **COMPLETE for what exists** | 204 backend tests, 200 passing. 4 failures are a known, isolated, already-diagnosed date issue — see [NEXT_STEPS.md](NEXT_STEPS.md). Frontend has no unit tests by design (verified via `tsc`/`eslint`/live browser instead, per this project's own stated convention). |
