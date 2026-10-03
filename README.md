# 🏸 Badminton Court Booking System - Group Assignment
## Public URL: https://pbse-week2.vercel.app/courts

Welcome to the repository for **Week 2 Group Assignment** in **Platform Based Software Engineering (PBSE)**.

---

## Project Overview

This repository contains the codebase and deliverables developed during Week 2 of the Platform Based Software Engineering course. The project focuses on setting up foundational platform architectures, modular component design, and collaborative software development practices.

* Badminton Court Booking System: a student books an available court for a one-hour slot, sees it in their bookings and can cancel it; an administrator manages the courts and can retire one. Staff and administrators can see everyone's bookings
* Interface: openapi.yaml (repository root)
* Deployment URL: https://pbse-week2.vercel.app (web application) — the API is served from the same address under `/v1`
* Deploying: docs/deployment.md, and [Deployment](#deployment) below
* Run the mock: cd spec && npm install && npm run mock

---

## Team Members

1. Muhammad Keenan Basyir
2. Muhammad Gibran Basyir
3. Aurelio Rafif Wicaksono
4. Thomas Nadandra Aryawida

---


## Repository Structure

```text
pbse-week2-Gibran/
├── openapi.yaml          # The contract: every operation, scope and response
├── vercel.json           # One Vercel project, two services: web and api
├── web/                  # Browser client (React + Vite)
│   └── src/
│       ├── views/        # One component per screen
│       ├── components/   # Field, Skeleton, StaleNotice
│       ├── auth/         # Keycloak adapter and AuthContext
│       ├── services/     # api.js — the only file that calls fetch
│       └── lib/          # View states, useResource, ETag store, problems
├── service/              # The API (Node + Express + PostgreSQL)
│   ├── src/              # routes, schemas, store, representations, auth
│   ├── api/index.js      # Vercel serverless entry point
│   ├── db/               # schema.sql, seed.sql, apply.js
│   └── tests/            # authz, cors and conditional suites
├── infra/                # Keycloak (docker compose + realm export)
├── spec/                 # Contract tooling: Redocly lint/docs, Prism mock
├── tests/contract/       # Schemathesis contract suite run in CI
├── docs/                 # Deployment guide, ADRs, A.9 runbook, checklists
└── .github/workflows/    # CI: the contract job
```

## A.1 Application Workflows

| Workflow | Screen | Role | API Operation | Calls |
|---|---|---|---|---:|
| Browse courts | Court list | Student | GET /v1/courts | 1 |
| Browse courts | Court detail | Student | GET /v1/courts/{courtId} | 1 |
| Create booking | Booking form | Student | GET /v1/courts, POST /v1/bookings | 2 |
| Create booking | Booking confirmation | Student | GET /v1/bookings/{bookingId} | 1 |
| View and cancel booking | Booking list | Student | GET /v1/bookings | 1 |
| View and cancel booking | Booking detail | Student | GET /v1/bookings/{bookingId} | 1 |
| View and cancel booking | Cancellation form | Student | GET /v1/bookings/{bookingId}, POST /v1/bookings/{bookingId}/cancellation | 2 |
| Manage courts | Court management list | Administrator | GET /v1/courts | 1 |
| Manage courts | Court management detail | Administrator | GET /v1/courts/{courtId} | 1 |
| Manage courts | Retirement action | Administrator | GET /v1/courts/{courtId}, POST /v1/courts/{courtId}/retirement | 2 |

## A.3 Session Storage and Security

The browser client uses the Keycloak JavaScript adapter for authentication. Access and refresh tokens are kept in memory by the Keycloak adapter and are not stored in `localStorage` or `sessionStorage`.

The browser only uses `sessionStorage` for the temporary `a3-return-to` value. This value stores the application path that the user was viewing before authentication was required, so the application can return the user to the same screen after signing in. It is not an authentication credential.

Keeping authentication tokens in memory reduces the risk of exposing reusable tokens through persistent browser storage. The consequence is that the tokens are lost when the page is fully reloaded. The application can then use the Keycloak SSO session to check whether the user is still authenticated and obtain a new session if possible.

When the API returns `401 Unauthorized`, the browser clears the local authentication state, remembers the current location, and offers the user a sign-in action.

When the API returns `403 Forbidden`, the browser explains that the authenticated user does not have the required permission and does not send the user through the sign-in flow again.

When the API returns `404 Not Found` for a specific resource, the browser shows a generic not-found message without revealing whether the resource exists for another user.

Signing out clears the local authentication state and calls the Keycloak logout endpoint.

## A.2 Application Skeleton and Routing

The browser client lives in `web/` (React + Vite). It is one client of the
service among several possible ones, and holds no rules of its own.

**One address per screen.** Every workflow in the A.1 table is reachable by
URL, so any screen can be linked, bookmarked, and reopened in a second tab
without losing its place.

| Address | Screen |
|---|---|
| `/` | redirects to `/courts` |
| `/courts` | court list |
| `/courts/{courtId}` | court detail |
| `/bookings` | the signed-in student's bookings |
| `/bookings/new` | booking form; `?courtId=` pre-selects a court |
| `/bookings/{bookingId}` | booking detail |
| `/bookings/{bookingId}/cancel` | cancellation form |
| `/admin/courts` | court management |
| `/callback` | returns from Keycloak to the remembered address |
| anything else | not-found screen |

No screen keeps its identity in a component variable. `/bookings/{id}`
re-fetches from the id in the URL, which is why opening it in a new tab
shows the same booking rather than the start page.

**One network layer.** `web/src/services/api.js` is the only file that calls
`fetch`. It owns the base URL, attaches the `Authorization` header, and
turns error responses into `ApiError`. Views call domain functions —
`getCourts()`, `cancelBooking()` — so that uniform 401 handling, ETag
bookkeeping, and a base URL that changes at deployment each have exactly one
place to live.

**Getting to a booking takes one click from anywhere.** A signed-in user sees
*Courts*, *My Bookings* and *Book a court* in the navigation, and a court's
detail page offers *Book this court*, which opens the form with that court
already selected (`/bookings/new?courtId=…`). The link is not shown for a
court that is retired or unavailable.

**Navigation reflects role, and that is all it does.** The court-management
link is rendered only for a token carrying `courts:write`. This is user
experience, not access control: the address can still be typed in directly,
and when it is, the service refuses the API calls behind it (A.9).

**Configuration comes from the environment.** `web/.env.example` lists every
variable; copy it to `web/.env.local`. Both the service base URL and the
Keycloak URL, realm, and client id are read from it, so nothing has to be
edited in source to deploy. Vite inlines every `VITE_`-prefixed variable
into the bundle where any visitor can read it, so no secret is kept there.

One variable is not an address: `VITE_KEYCLOAK_SCOPES`. Scopes marked
*optional* on a Keycloak client are absent from the access token unless the
client asks for them, and `bookings:write` is optional on
`badminton-student-web`. Without requesting it, the application signs a
student in successfully and then receives 403 on every booking it tries to
create.

## A.4 Same-origin Policy and CORS

The web application and the service are different origins — different
scheme, host, and port — so the service states which origins may read its
replies. This is configured in `service/src/middleware/cors.js` and is
covered by `service/tests/cors/cors.test.js` in CI.

**The allow-list is explicit.** Origins come from `CORS_ALLOWED_ORIGINS`, a
comma-separated list. The incoming `Origin` header is never reflected back:
reflecting it passes every "does cross-origin work?" test while in fact
permitting every origin on the internet, because the check can never fail.
`Vary: Origin` is sent on every response, including refused ones, so a
shared cache cannot serve one origin's allow-header to a page from another.

**The preflight is answered above the authentication layer.** A request
carrying `Authorization` and `Content-Type: application/json` is not simple,
so the browser first sends `OPTIONS` with `Access-Control-Request-Method`
and `-Request-Headers`. That preflight carries no token — it is asking
permission to send one. If it reached `app.use(authenticate)` every
cross-origin write would fail with a 401 that had nothing to do with the
user's session.

**`ETag` is exposed deliberately.** Browsers hide all but a short default
list of response headers from the page. An `ETag` the client cannot read is
one it cannot send back in `If-None-Match`, so A.7 would silently never
produce a 304. `If-Match` and `If-None-Match` are likewise already in the
allowed request headers, so A.8 does not fail at the preflight.

**CORS is not access control.** It governs what the browser lets a page
*read*, not what the service does. A request from an unlisted origin is
still delivered and still processed — the test
`an unlisted origin's real request is still processed` asserts exactly that,
and gets a 201. "CORS blocked it, so the booking was never created" is
false. Every rule that matters is enforced by the authorisation layers from
Session 4, which is what A.9 verifies.

## A.5 The Four States of Every View

Every view that shows data from the service holds exactly one of four
states, declared in `web/src/lib/view-state.js` and moved between by
`web/src/lib/useResource.js`. The assignment declares this as a TypeScript
union; this project is JavaScript, so the union is expressed as
constructors. The property that matters is the same — the four states are
named up front rather than discovered one at a time.

```js
{ kind: 'loading' }
{ kind: 'empty' }
{ kind: 'error',   problem, willRetry }
{ kind: 'content', data, fetchedAt, stale, lastAttempt }
```

| State | What is shown |
|---|---|
| Loading | Skeleton rows with the layout already formed (`components/Skeleton.jsx`) — not a blank screen, which makes a user reload and start the wait again |
| Empty | An explicit sentence, and where there is one, the next step: "You do not have any bookings yet." |
| Error | What failed, in domain terms, plus a manual retry control. 401, 403 and 404 are answered differently, per A.3 |
| Content | The data, above an age marker saying when it was fetched |

**Loading means no data is held.** A background refresh keeps what is on
screen. This is the distinction that stops a poll blanking the list every
cycle, and it is why `useResource` exposes `retry()` and `refresh()`
separately: a manual retry from the error state starts the wait over
visibly, a refresh does not.

**A failed refresh does not discard good data.** It keeps the content and
marks it stale, and the view then says so: *"Showing courts as of 12:04.
Reconnecting… Last attempt failed 8 seconds ago."* Stale data shown as
though it were current is worse than an error, because an error announces
its own condition and old data does not. The age marker is rendered
whenever there is content, not only when a refresh has failed — the time
the data was fetched is part of reading it honestly.

**Where the model is used.** The court screens — the court list, court
detail and court management — read through `useResource` and get all of the
above, including the skeleton, the stale marker and background polling. The
booking screens (my bookings, booking detail, the booking form and the
cancellation form) were reworked in Session 5 and now load their data
directly: each shows a loading line, an explicit empty message where a list
can be empty, and a separate answer for 401, 403, 404 and other failures,
with a retry button. They do not poll and do not show an age marker.

**A single object has no empty state.** An absent court or booking is a 404,
which is the error state. Only a collection can be legitimately empty.
Conflating the two would show "no bookings" for a booking that belongs to
somebody else, which is both wrong and a small leak.

The model's logic is covered by `web/src/lib/view-state.test.js`
(`cd web && npm test`).

## A.6 Forms and the Presentation of Failure

**The service names the field and says why.** A 400 or 422 carries an
`invalid-params` list — the extension member RFC 9457 uses in its own
example — where each entry is `{ name, reason }`:

```json
{
  "type": "https://api.example.com/problems/validation-failed",
  "title": "One or more fields are invalid",
  "status": 422,
  "detail": "endTime must be after startTime",
  "invalid-params": [
    { "name": "endTime", "reason": "The end time must be after the start time" }
  ]
}
```

This replaced an earlier `invalidFields: ["endTime"]`. A bare list of names
tells a client which box to mark red but not what to write beside it, and a
client that invents the wording is guessing at a rule only the service
knows. The reason now travels with the name. The member is documented on
the `Problem` schema in `openapi.yaml`, where it previously was not.

**The client reads the document, not the text.** `web/src/lib/problem.js`
turns a refusal into a `Problem` carrying `type`, `title`, `detail` and the
invalid parameters indexed by field name (`fieldReason('endTime')`). Every
error raised by `api.js` is one of these.

**The booking form offers only bookable slots.** Session 5 reworked it
around how a court is actually booked: the user picks a court, a date and a
one-hour slot between 08:00 and 22:00, rather than typing two timestamps.
Only active, available courts are listed, and a slot that has already
started is disabled — and cleared if it starts while the page is open. Two
consequences follow. The end time is always the start plus one hour, so the
"end before start" refusal (422) can no longer be produced from the form; it
is still enforced by the service and still covered by its tests. And a slot
somebody else has already booked is not known in advance, so it is the
service that refuses it.

**Form and session failures are shown in different places.** A refusal of
the request as a whole — an overlapping slot (409), a retired court — is
shown above the form, in domain terms: *"This time slot is no longer
available. Please choose another slot."* Other refusals show the service's
`detail`. A 401 or 403 replaces the form, as A.3 describes. The cancellation
form follows the same pattern, and checks locally that a reason is given and
is at most 500 characters.

**Client validation is user experience and guarantees nothing.** Every rule
the form checks exists again in `service/src/schemas/bookings.js` and
`service/src/schemas/reason.js`, which is the only place a rule actually
holds. A.9 is what demonstrates this.

**One idempotency key per submission.** The form generates a fresh
`Idempotency-Key` each time it is submitted, and the submit button is
disabled while the request is in flight, so a double click cannot send two
requests. The service's guarantee — the same key and body are answered with
the stored 201, a reused key with a different body is a 409 — is exercised
in CI by the idempotency replay step. Note the trade-off: because the key is
not kept between submissions, pressing *Book* again after a request whose
answer was lost is treated as a new attempt. The overlap check then refuses
it with 409 if the first one did succeed, so no second booking is made for
the same slot.

The cancellation operation carries no idempotency key, deliberately: the
contract makes it naturally idempotent, answering 200 with the existing
cancellation when a booking is already cancelled, because the end state the
caller asked for already holds.

**Times are converted before they are sent.** A `datetime-local` input
produces `2026-09-27T14:30` — no seconds, no offset — which the contract's
RFC 3339 rule refuses. The browser's own zone is applied in the form, so the
user is not shown a refusal they did not cause.

Covered by `web/src/lib/problem.test.js` and, on the service side, by the
cancellation-reason case in `service/tests/authz/layer2-scope.test.js`.

## A.7 Conditional Reads

**Every read carries an `ETag`.** `service/src/etag.js` derives it from the
representation itself — a SHA-256 of the body — so the tag changes when, and
only when, what the client would receive changes. Deriving it from a row's
`updated_at` would miss two changes inside one clock tick and would not
notice a change in how the representation is rendered. It is strong, not
weak, which is what makes it safe to reuse for `If-Match` in A.8.

**What a 304 saves is the body, not the work.** The service still loads the
data and decides what the current version is before it can answer at all. A
client polling every fifteen seconds receives an empty response instead of
its whole booking list, which is the saving.

**The tags outlive re-renders.** `web/src/lib/etag-store.js` holds them for
as long as the page does, keyed by request path, so `/bookings` and
`/bookings?status=confirmed` are separate versions. A tag kept in a variable
inside the polling function would be recreated on every cycle: no poll would
ever send `If-None-Match`, the service could never answer 304, and the
saving would silently never happen while nothing looked broken.

The stored body sits beside the tag, because a 304 has none. Without it a
304 would be a successful read the client could not render — which looks
like empty data, and is worse than an error.

**A 304 is a successful read.** `useResource` treats it as confirmation that
what is held is current: the stale marker is cleared and `fetchedAt` moves
forward, because the service has just said this version is current as of
now.

**Polling** runs on the court list and the court-management list, every
30s, as background reads, so the list on screen is never replaced by a
skeleton. A tab nobody is looking at is not polled. The booking screens do
not poll since their Session 5 rework (A.5); they read once when opened and
again on retry. Every read still goes through `api.js`, so each one still
sends `If-None-Match` and can be answered 304.

**Cache-Control: private, no-cache** accompanies every ETag. These
representations are shaped by who asked — a student's booking list is theirs
alone — so a shared cache must not reuse one for somebody else. Signing out
clears the store, so the next person at the browser finds nothing.

**Cursor pagination, not offset**, was already in place from Session 3 and
is unchanged: both collections page by a cursor naming a row, which keeps
its identity however many rows are inserted above it.

`ETag` is readable by the page only because A.4 lists it in
`Access-Control-Expose-Headers`. Browsers hide all but a short default list
of response headers, and an ETag the client cannot read is one it cannot
send back.

Covered by `service/tests/conditional/reads.test.js` (9 tests, against a
real database) and `web/src/lib/etag-store.test.js`.

### A note on the build

`npm run build` in `web/` runs `scripts/verify-build.js` afterwards. During
A.7 a `throw` at module scope guarding a missing `VITE_` variable was found
to have deleted the entire application from the bundle: Vite inlines
`import.meta.env` at build time, the guard became unconditional, and Rollup
dropped everything downstream of it. `vite build` reported success and
emitted React with none of this application in it. The check fails the build
if the bundle no longer contains our own code.

## A.8 Conditional Writes

**`If-Match` is required, not optional.** A write against an entity another
client can change concurrently must say which version it was written
against. Without one the service has no basis on which to refuse a write
that silently overwrites somebody else's change — the lost update — so a
request arriving without the header is refused with `428 Precondition
Required` (RFC 6585) rather than guessed at. `If-Match: *` is accepted and
means "whatever version is current": an explicit decision, not an omission.

**The precondition is checked after authorisation, never before.** The
order in `POST /v1/bookings/{id}/cancellation` is: validate (400) → load →
absent (404) → not yours (404) → precondition (428/412) → write. A
precondition answered first would tell a caller with no right to a booking
that the booking exists, which is exactly what the identical 404 for
"absent" and "not yours" exists to hide. A test asserts that probing
somebody else's booking returns 404 whether the precondition is missing or
wrong.

**The tag is computed from the representation the caller saw.** An
administrator reading a fuller representation of a booking holds a
different tag from the student who owns it — correctly, because they read
something different.

**A 412 is a normal condition, not an error.** The client does not show an
error screen. It re-reads, re-renders, and shows the entity as it stands
now:

- **Court management** keeps the list on screen and says, above it:

  > That court was changed by a colleague while this page was open.
  > Nothing was modified, and the list below is as it stands now.

- **The cancellation form** reloads the booking. When two windows cancel
  the same booking, the second window's reload finds it already cancelled
  and shows *Booking Already Cancelled* with its details. Nothing the
  second window sent was applied.

The 412 carries the current `ETag`, so a client can recover without an
extra round trip to discover what it missed.

**The court-management screen reads before it writes.** The list's ETag is
the version of the *collection*, which is not the version of any one court
in it. Retiring a court therefore reads that court first and writes against
its own version.

Covered by `service/tests/conditional/writes.test.js` — 9 tests including
the two-windows scenario end to end, that a refused write leaves the
original reason intact, and that the precondition leaks nothing.

### Resolved: the retirement operation, and who may call it

Both findings recorded here during A.8 are now closed.

`POST /v1/courts/{courtId}/retirement` (`deactivateCourt`) was documented in
`openapi.yaml` from Session 2 and never implemented — `routes/courts.js`
registered two GETs and nothing else, so the client's call met the 404
handler. It is now implemented, following the same five-step order as the
cancellation: validate, load, absent 404, precondition, write. Retiring an
already retired court answers 200 with the existing record, not 409, because
the end state the caller asked for already holds. The `courts` table gained
`retired_at` and `retire_reason`; `db/schema.sql` applies them with
`ADD COLUMN IF NOT EXISTS`, so `npm run db:setup` brings an existing
database up to date.

Who may call it was the larger problem. Nothing distinguished the six test
users — all held only `default-roles-badminton-booking` — so `admin-a` and
`student-a` were the same person as far as the platform was concerned, and
permission came from which OAuth client you signed in through rather than
from who you are. Separately, `courts:write` carried
`include.in.token.scope: "false"`, so it never reached a token's `scope`
claim and `requireScope("courts:write")` would have refused everybody.

The realm now has `student`, `staff` and `administrator` roles, held by the
matching test users, and the two powerful scopes are limited to the roles
that should be able to obtain them. There is one web client for everybody.
The reasoning, and why this does not reverse the Session 4 decision to
authorise on scopes rather than roles, is in
`docs/decisions/0004-peran-dan-penerbitan-scope.md`.

## Deployment

**One address for the application and the API.** The root `vercel.json`
deploys the repository as one Vercel project with two services:

| Path | Served by |
|---|---|
| `/v1/*` and `/health` | `api` — the Express app in `service/`, run as a serverless function through `service/api/index.js` |
| everything else | `web` — the Vite build of `web/`, with every path rewritten to `index.html` |

The rewrite matters: opening `/bookings/{id}` directly, refreshing it, or
opening it in a new tab would otherwise reach a host looking for a file at
that path, and answer 404 before React Router ever saw the URL.

The database is Neon PostgreSQL, reached through `DATABASE_URL`, which is set
in Vercel's dashboard and never committed. Step-by-step instructions are in
`docs/deployment.md`.

**Keycloak is reachable from outside `localhost`.** The deployed web
application signs users in against a Keycloak the browser can reach, so the
compose file takes its public address from `KC_HOSTNAME` (defaulting to
`http://localhost:8080` for local work). `KC_PROXY_HEADERS: xforwarded`
lets Keycloak run behind a reverse proxy that terminates HTTPS: it builds
its redirect and issuer URLs from the `X-Forwarded-*` headers, so they
carry the public `https://` address rather than the internal one. The
issuer it reports must match the service's `OIDC_ISSUER` exactly, or every
token is refused with 401.

The web client's realm (`badminton-booking`) and client id
(`badminton-student-web`) are set in `web/src/auth/keycloak.js`; the
Keycloak address comes from `VITE_KEYCLOAK_URL`.

## Test accounts for the demonstration

All six accounts use the password `password`. Two are used in the
presentation:

| Account | Role | Scopes in the token | What they demonstrate |
|---|---|---|---|
| `student-a` | `student` | `courts:read`, `bookings:read`, `bookings:write` | Browsing courts, booking, cancelling — and being refused court management |
| `admin-a` | `administrator` | the above plus `courts:write`, `bookings:fulfil` | Retiring a court, and the 412 when two windows do it at once |

`student-b`, `admin-b`, `staff-a` and `staff-b` exist for the concurrency
and object-authorisation tests.

### Still to verify against a running Keycloak

The realm changes above have not been run against Keycloak — no container
was available while they were made. After `docker compose -f
infra/docker-compose.auth.yml up` and re-importing the realm, two checks
matter:

1. Sign in as `student-a` and run `__badminton.scopes()` in the console.
   The list must **not** contain `courts:write`.
2. Run the A.9 console attack as `student-a`:

   ```js
   await __badminton.call(
     "POST", "/courts/<an active court id>/retirement",
     { reason: "from the console" }, { "If-Match": "*" }
   )
   ```

   It must answer **403**.

A 200 or a leaked scope in check 1 means the realm is not withholding the
scope by role, and the service needs to check the role itself in addition to
the scope. Everything needed for that is in place; only the decision would
change.
