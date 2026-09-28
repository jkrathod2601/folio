# folio — backend

Hapi.js API for Folio, backed by MongoDB. Independent npm package — the frontend
in `../bookreading` is not touched by anything here.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

MongoDB must be reachable at `MONGODB_URI`. It is installed as a Homebrew
service and starts at login:

```bash
brew services start mongodb-community   # already running here, 8.3.11
mongosh "mongodb://127.0.0.1:27017/folio"
```

Data lives in `/opt/homebrew/var/mongodb`, logs in
`/opt/homebrew/var/log/mongodb`. If the port is already taken, a stray manual
`mongod` is squatting it — `lsof -nP -iTCP:27017 -sTCP:LISTEN` will show the PID
holding it.

## Database

`folio` lives on-device only. `mongod` is bound to `127.0.0.1, ::1` and is
unreachable from the LAN — no Atlas, no `mongodb+srv` connection string
anywhere in the config.

```bash
npm run db:init   # idempotent: creates "folio" if absent
```

Mongo materialises a database only on first write, so an untouched `folio` will
not appear in `listDatabases`. `db:init` guarantees it exists by upserting a
`meta` document, which is also the natural place to record applied migrations.

## Verify

```bash
curl http://127.0.0.1:4000/api/ping    # liveness, no DB touched
curl http://127.0.0.1:4000/api/health   # readiness, pings MongoDB
```

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/ping` | — | Liveness. Always 200 if the process is up. |
| GET | `/api/health` | — | Readiness. 200 when MongoDB answers, 503 otherwise. |
| GET | `/api/auth/config` | — | Which providers are configured. |
| GET | `/api/auth/google` | — | 302 to Google's consent screen, sets the state cookie. |
| GET | `/api/auth/google/callback` | — | Google redirect target. Sets the refresh cookie, 302s to the SPA. |
| POST | `/api/auth/refresh` | cookie | Rotates the refresh cookie, returns a new access token. |
| GET | `/api/auth/me` | bearer | The signed-in user. |
| POST | `/api/auth/logout` | cookie | Revokes this session. |
| POST | `/api/auth/logout-all` | bearer | Revokes every session for the account. |
| GET | `/api/auth/sessions` | bearer | Live sessions, for a "where am I signed in" screen. |
| GET | `/api/admin/users` | admin | Account list. 403 for readers. |
| PATCH | `/api/admin/users/:id/role` | admin | Set `role` to `reader` or `admin`. |
| POST | `/api/books` | bearer | Create a book. 201 with the created book. |
| GET | `/api/books` | bearer | The signed-in author's books. `?status=`, `?limit=`. |
| GET | `/api/books/:id` | bearer | One book. 403 if it is not visible to you. |
| PATCH | `/api/books/:id` | bearer | Edit. **Author only.** `design` merges. |
| DELETE | `/api/books/:id` | bearer | Delete. Author or admin only. |

Note: `mongosh` 2.x resolves unknown collection names to `undefined` instead of
a lazy handle, so scripts must use `db.getCollection("name")`, not
`db.name.insertOne(...)`.

## Auth

Google is the only sign-in provider. Two credentials, deliberately asymmetric:

- **Access token** — JWT, 15 min, `Authorization: Bearer`. Held in memory by the
  frontend and never written to `localStorage`, a cookie, or the URL. It is
  bearer-only: `/auth/me` returns 401 for a cookie-only request, which is what
  keeps the split meaningful.
- **Refresh token** — JWT, 30 days, in an `HttpOnly; SameSite=Lax` cookie that
  JavaScript cannot read. Hashed with SHA-256 in the `sessions` collection; the
  raw token is never stored, so a database leak cannot be replayed.

`Secure` is forced on in production. `SameSite=Lax` still permits the top-level
GET redirect Google sends the user back on while blocking cross-site POSTs,
which is what protects `/auth/refresh` and `/auth/logout` from CSRF.

Refresh tokens **rotate on every use**. Redeeming one marks the old row
`rotatedAt` and issues a replacement in the same `family`. Presenting an
already-redeemed token is what a stolen cookie looks like, so the entire family
is revoked and both the thief and the real user are logged out. Sessions also
carry a TTL index, so Mongo reaps expired rows with no cron.

Access tokens are returned to the SPA in the **URL fragment**
(`/auth/callback#access_token=...`), which is never sent to a server or written
to an access log. The frontend scrubs it from the address bar immediately.

Google's redirect URI must be registered as an authorised redirect URI, and it
must be **on the same origin as the app**:

```
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
```

In development the browser starts on the Vite origin and Vite proxies `/api` to
the backend, so the callback must be registered against `localhost:5173` too —
not against `127.0.0.1:4000`. Cookies are host-scoped, so a callback on a
different host than the one that set the state cookie will never receive it and
every sign-in fails with `no state cookie was sent`. `npm run test:auth` asserts
this invariant.

Blank credentials are allowed
in development — the server boots and `/auth/config` reports
`googleEnabled: false` so the UI can disable the button — but boot **fails** in
production without them.

### Tests

```bash
npm run test:auth
```

17 checks covering rotation, replay detection, family revocation, cross-type
token confusion, cookie flags, roles and admin scoping, the redirect-URI origin
invariant, and that public routes stay public. It cleans up after itself,
including after a crash.

## Roles

`users.role` is one of `reader` (the default for every Google sign-in) or
`admin`. The `users` table holds auth and basic profile only — `googleSub`,
`email`, `name`, `username`, `portraitUrl`, `verified`, `bio`, `location`,
`joined`, `role`. The denormalized counters that were in the first draft
(`followers`, `following`, `words`, `streak`) were removed: they were seeded
defaults nothing ever incremented, and each is a query or a write-time counter
against the tables that will own them. `npm run migrate:users` strips them and
backfills `role` on existing accounts; it is idempotent.

Roles are **not** in the access token. The scheme reads the role from Mongo on
every request, so revoking an admin takes effect on their next call rather than
whenever their 15-minute token happens to expire.

```bash
npm run set-role -- me@example.com admin           # must already exist
npm run set-role -- me@example.com reader          # demote
npm run set-role -- me@example.com admin --create  # create the account
```

The first admin is bootstrapped with `ADMIN_EMAILS` in `.env` (comma separated),
which promotes a matching account on its next sign-in. Demotion is always
explicit — removing an address from `ADMIN_EMAILS` does not silently strip an
existing admin.

`ADMIN_EMAILS` is the bootstrap only. Once an admin exists, `PATCH
/api/admin/users/:id/role` is the normal path, and it is what the admin panel at
`/admin` calls. The endpoint refuses to demote the final admin, because that
would leave nobody able to promote anyone back — promote a second admin first.

## Books

`src/models/Book.js`. The author is taken from the access token, never from the
request body, so a client cannot write onto another shelf.

**Reading and writing have different rules, so ownership is not a scope.** A
`public` book is readable by anyone signed in; only the author may edit or
delete. `Book.isVisibleTo(user)` covers the read side, and an explicit
author check covers the write side. `visibility` is discovery, not security.

**Cover design is stored as hex, not as class names.** A stored class name would
couple the document to the theme bundle — renaming a zinc step, or dark mode
inverting it, would silently repaint books the author already designed. Hex is
what the author picked. `BookCover.jsx` on the frontend is the single renderer
for both the creation preview and the book page, so the preview cannot drift
from the real thing.

`LAYOUTS` in the model and `LAYOUTS` in `bookreading/src/lib/bookDesign.js` are
two copies of the same list. An unknown layout falls back to `bottom-left` in
the renderer, so the two have to change together.

**`shape` was removed.** Books used to store a `book`/`pen`/`note` glyph that the
cover rendered as an icon. It is gone, along with `design.glyphPlacement`:
a glyph tells a reader what kind of book something is before they have read the
title, which is a strange thing for a book to assert about itself. `design.layout`
replaces it and only positions type. Run `npm run migrate:books` to drop the old
fields and backfill `design.layout` / `design.titleScale` on existing books.

`pageCount` and `currentPage` are absent from the create and patch schemas, and
Joi rejects unknown keys — a client that sends them gets a 400 naming the field.
They are counters, not form values, and move as pages are written and read.

### Authorizing an admin route

```js
import { adminOnly } from '../plugins/auth.js'

server.route({ method: 'GET', path: '/thing', options: adminOnly, handler })
```

Hapi authorizes a route's `scope` against the scope array the scheme returned, so
the check runs *before* the handler and returns 403 `Insufficient scope`. There
is no in-handler role check that can be forgotten. Note that hapi has no
`server.auth.scope()` — scopes are declared on the route, and the scheme is what
populates `credentials.scope`.

`scripts/mint-session.js [email] [outfile]` writes a real user + refresh token to
a file. Useful for driving a signed-in browser without going through Google —
re-mint before each run, because the token is single-use by design.

## Layout

```
src/
  server.js      process entry — start, signal handling
  app.js         builds the hapi server and registers plugins + routes
  config/        env parsing, validated with Joi at boot
  db/            mongoose connection, ping, disconnect
  models/        User (role + profile), Session
  auth/          tokens (sign/verify/rotate), cookies, google, jwt scheme
  plugins/       db, error, auth (cookie defs, jwt strategy, adminOnly)
  routes/        health, auth, admin
scripts/         init-db, test-auth, mint-session, set-role, migrate-users
```

Routes live under an `/api` prefix. Every error response is
`{ error: { statusCode, message } }`.

## Notes

- `config/` throws at boot if `MONGODB_URI` is missing or malformed — the server
  will not boot half-configured.
- The db connection is established in `onPreStart`, so a failed connection
  aborts `server.start()` instead of leaving a live server with a dead db.
- The connection is closed in `onPostStop`, not `server.events.on('stop')` —
  hapi does not await async event listeners, so a `stop` listener would fire and
  be abandoned mid-disconnect.
- `autoIndex` is on in dev/test and off in production, so indexes are built by
  hand before deploy.
- Auth **fails closed**: `server.auth.default` is `mode: 'required'`, so a new
  route is protected unless it explicitly sets `auth: false`. Using `mode: 'try'`
  would make an unannotated route quietly public.
- Misconfiguration returns 503, never 500. Hapi replaces the payload of any 500
  with "An internal server error occurred", so a missing env var reported as a
  500 is indistinguishable from a crash on the client.

## Book covers

`PUT /api/books/:id/cover` · `GET /api/books/:id/cover` · `DELETE /api/books/:id/cover`

A cover is stored inline on the book as `cover: { data, contentType, size, updatedAt }`,
capped at **1 MB** (`MAX_COVER_BYTES` in `src/models/Book.js`).

**Upload is raw bytes, not multipart or base64.** The body *is* the file and
`content-type` carries the format. That keeps the 1 MB `payload.maxBytes` an
honest wire limit; base64 would inflate every cover by a third and force a
1.4 MB allowance to honour a 1 MB cap. The client uses
`apiFetch(path, { raw: true })` for this — `JSON.stringify(file)` is `{}`.

Accepted types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`.

The cap is enforced three times, deliberately: `maxBytes` rejects on
content-length before buffering; the buffered length is re-checked (a chunked
request can under-report); and the schema `validate` protects a document written
by a script.

**`toJSON` strips `cover.data`.** Book JSON carries only
`{ contentType, size, updatedAt }` — listing a shelf with 1 MB covers costs
~500 bytes per book, not 1 MB. Clients read bytes from
`GET /api/books/:id/cover` and treat the subdocument's *presence* as "has a
cover", which is what `coverUrl: null` used to signal.

**This is the wrong shape for a fleet of images and is scoped to it.** One
cover per book at 1 MB is comfortably inside Mongo's 16 MB document limit. Move
to GridFS or object storage before covers get larger, more numerous, or served
through a CDN.
