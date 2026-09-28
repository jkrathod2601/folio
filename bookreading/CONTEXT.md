# Folio — Engineering Context

Written end of session 1. The app is complete and browser-verified as a frontend;
**the entire data layer is static mock data with zero network calls.** Session 2 is the backend.

---

## 1. Quick start

```bash
cd /Users/jay/Documents/Bookreading/bookreading
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run lint     # oxlint, NOT eslint
```

No `.env`, no API keys, no database, **no Git repository** (nothing is version-controlled yet —
worth `git init` before touching the backend, so this work is recoverable).

## 2. Stack

| Layer | Choice |
|---|---|
| Build | Vite 8 + `@vitejs/plugin-react` |
| UI | React + `react-router-dom` |
| Icons | `lucide-react` |
| Primitives | Radix UI (avatar, dialog, dropdown-menu, hover-card, popover, progress, scroll-area, separator, slot, tabs, toggle, toggle-group, tooltip) |
| Styling | Tailwind + `tailwindcss-animate` + `tailwind-merge` + `clsx` + `class-variance-authority` |
| Lint | **oxlint** (there is no ESLint config) |
| Fonts | Gruppo (display) / Nunito (body) / Fira Code (mono), loaded from index.html |

`cn()` in `src/lib/utils.js` is the merge helper used everywhere.

**Not present yet:** no fetch client, no state manager, no auth, no ORM. All state is
component-local or `localStorage`.

## 3. ⚠️ The one thing that will bite you

`src/index.css` redefines the entire zinc scale as CSS variables, and `.dark`
**inverts those variables** rather than swapping to darker values. Dark mode is
*inverted paper*, not "black background".

Consequence: **`bg-zinc-950` is the near-white surface in dark mode, and `text-zinc-950`
is the near-black ink.** Tailwind's normal assumptions are inverted.

- Use the semantic pairings: page = `bg-zinc-50` / `bg-white` / `text-zinc-950`
- Dark bands = `bg-zinc-950` + `text-white`
- **Never** hand-write `dark:bg-zinc-900` / `dark:text-white` overrides. They are
  already wrong, and they are the single most common regression in this codebase.
  The light classes already flip.

This bit three times this session (Zen reader, author profile, and once during
contrast auditing). Please don't add a `dark:` variant without testing both themes.

## 4. Routes

All in `src/App.jsx`.

| Path | Component | Notes |
|---|---|---|
| `/book/:bookId/read/:pageId` | `ZenReaderPage` | **Outside `Layout`** — full-screen reader, no shell |
| `/` | `HomePage` | feed |
| `/discover` | `DiscoverPage` | |
| `/book/:id` | `BookPage` | |
| `/page/:bookId/:pageId` | `PageDetailPage` | |
| `/page/:id` | `PageDetailPage` | legacy single-arg route |
| `/write` | `CreatePage` | |
| `/books/new` | `NewBookPage` | book setup — **`POST /api/books`**, live cover preview. No shape picker; `design.layout` instead |
| `/books/:id/edit` | `BookEditPage` | **`PATCH /api/books/:id`** + cover upload. Edit action lives on the profile cards, not a book page, because `/book/:id` is still mock |
| `/library` | `LibraryPage` | |
| `/notifications` | `NotificationsPage` | thin |
| `/profile` | `MyProfilePage` | **yours — real API data**, your books from `GET /api/books` |
| `/author/:username` | `AuthorProfilePage` | other people — still **mock data** |
| `/circles` | `CirclesPage` | thin |
| `/settings` | `SettingsPage` | thin |
| `/admin` | `AdminPage` | **`RequireAdmin`** — only in the sidebar when `user.role === 'admin'` |

Unknown authors render a "No such author" state rather than throwing.

`/profile` and `/author/:username` are deliberately **different components**.
`/profile` is yours and reads the API; `/author/:username` still reads
`data/books.js` because no authors endpoint exists yet. They merge when one does.

⚠️ **Do not link a real book id to `/book/:id` yet.** `getBook()` does
`books.find(b => b.id === Number(id)) ?? books[0]`, so a 24-char hex id falls
through to the first seeded book and renders the wrong title with total
confidence. `MyProfilePage` shows book cards unlinked for this reason.

## 5. File map

```
src/
  App.jsx                     route table
  main.jsx
  data/books.js               ⚠️ THE MOCK DATABASE — see §6
  lib/glyphs.js               catalog icon-key → component map
  lib/theme.jsx               dark mode provider + useTheme
  lib/utils.js                cn()
  lib/bookDesign.js           cover layouts, palettes, WCAG contrast helpers
  lib/glyphs.js               mock `glyph` key -> lucide icon (legacy, see §8)
  store/ui.js                 sidebar collapse state (shared by 3 components)
  components/layout/          Layout, Header, Sidebar
  components/ui/              19 shadcn-style primitives
  components/AdminBadge.jsx   role chip, admin = filled / reader = outlined
  components/BookCover.jsx    the ONE cover renderer (preview + book page)
  components/BookForm.jsx     shared create + edit form (both wrap it)
  components/CoverDesigner.jsx  cover controls, shared by create and edit
  components/CoverImageUpload.jsx  1 MB upload, wired to useUploadCover
  components/GenrePicker.jsx  free-text genres, shared by create and edit
  components/ColorSwatch.jsx  colour input, shared by create and edit
  components/Field.jsx        Field + the shared form label/input class strings
  pages/MyProfilePage.jsx     your profile — real books from GET /api/books
  hooks/                      useAuth, useBooks, useAdmin
  pages/                      17 route components
```

Three files hold essentially all the domain logic: `src/data/books.js`,
`src/pages/BookPage.jsx`, `src/pages/AuthorProfilePage.jsx`.

**§12 step 5 is partly done:** `folio:new-book` is gone. `NewBookPage` now
creates a real book via `POST /api/books` and navigates to `/write?book=<id>`.
The studio does not read that id yet — the pages model is the next piece.

## 6. Data model — what the backend must reproduce

Everything is in `src/data/books.js`, exported as: `books, authors, getAuthor,
annotations, genres, risers, recentReaders, library, shelves, emptyMessages,
getBook, getPage, getShelf, getResumeTarget, compact`.

**Author** — keyed by short id (`jay`, `neha`, …), *not* username:

```js
{ name, username, aliases: [], followers, following, bio,
  location, joined, verified, streak, words, portrait }
```

`getAuthor(ref)` accepts the key, the `username`, or any alias. This is why
`/author/jay`, `/author/jayrathod` and `/profile` all resolve to the same person.
**In a real DB, make the id a UUID/slug and keep a separate `username` unique
index + an `aliases` table.** Do not keep the short-key-as-primary-key shape —
it exists only because it was convenient for a JS object literal.

**Book:**

```js
{ id, title, author, pages, reads, likes, cover, glyph, mark, tag,
  genres: [], blurb, currentPage, status }
```

- `status` is only present on Jay's books (`"published"` / `"draft"`), not all of
  them. The author profile treats a missing `status` as published.
- `pages` (a count) disagrees with the real number of seeded pages in several
  books. `pagesList` is the truth; `pages` is a display number.
- `cover: null` means "render the glyph fallback", which is used deliberately.

**Page** — `{ id, title, body, readTime, mood? }`. **Page ids restart per book.**

`getBook(id)` derives two things at runtime that are *not* stored:

```js
authorInfo: authors[book.author]
pagesList:  (pagesByBook[book.id] ?? []).map((page, i) => ({ ...page, id: i + 1 }))
```

**Annotation** (marginalia / endorsements):

```js
{ id, author, handle, text, likes, time }
```

A single flat array shared by `PageDetailPage`, `ZenReaderPage` and
`AuthorProfilePage` — it is not scoped to a book or page today. When the backend
lands this needs `bookId` / `pageId` foreign keys, and `time` becomes a timestamp
rendered relatively rather than a hardcoded `"2 hours ago"` string.

## 7. Persistence keys

| Key | Written by | Holds |
|---|---|---|
| `bookreading-theme` | `lib/theme.jsx` | `"light"` / `"dark"` |
| `folio:zen` | `ZenReaderPage` | type scale, leading, canvas tint, rate, muted |
| `folio:bookmark:<bookId>:<pageId>` | `ZenReaderPage` | `["1"]` |
| `folio:followed` | `AuthorProfilePage` | JSON array of usernames |
| `folio:sidebar-collapsed` | `store/ui.js` | `"true"` when the sidebar rail is collapsed |
| `folio:auth:returnTo` | `LoginPage` | path to return to after a Google sign-in |

`bookreading-theme` is deliberately **not** renamed to `folio-*` — renaming the
product must not invalidate saved user themes. Keep it that way.

## 8. Design language

Strict monochrome. No accent colors anywhere.

**One deliberate exception: a book cover.** The author picks its colors, stored
as hex in `books.design` and rendered inline by `BookCover.jsx`. Dark mode does
not touch a cover — a cover is the author's design, not an app surface. The rest
of the chrome stays monochrome.

**`LAYOUTS` is applied to two different elements, on purpose.** Each layout in
`bookDesign.js` supplies both a `place` and an `align`: `place` is the root's
`justify-content` (where the type block sits in the cover) and `align` is the
content block's `align-items` (how the text lines up once it is there). Swapping
them, or collapsing them to one property, silently breaks `top-left` and
`bottom-left` — the text lands centred instead of pinned to its corner. This was
a live bug, found by rendering the four layouts rather than by reading the JSX,
so treat "looks centred" on a corner layout as a regression, not a style choice.

**`glyph` is now legacy and shrinking.** A new book stores no shape at all; its
cover is `design.layout` + `design.ornament` + `design.titleScale`. The mock
catalog in `data/books.js` still carries `glyph` on 8 books and six pages still
read it through `lib/glyphs.js`. Those die when `data/books.js` is replaced by
the API. Do not extend `glyphs.js` for new work.

- Display: `font-heading` (Gruppo, uppercase, wide tracking)
- Body: `font-body` (Nunito)
- Meta/mono: `font-code` (Fira Code, uppercase, `text-label-sm` / `[11px]`, wide tracking)
- `glyph` keys map through `src/lib/glyphs.js`: `book, page, pen, note, quote,
  landmark, brain`. Any new content type must pick from this set or the map needs
  extending.

## 9. Author profile access

Two entry points, both verified working:
- **Sidebar** → `New Book` (for creating)
- **Top-right Header avatar** → `/author/jay` (`aria-label="Open your author profile"`)
- Book page author block + zen reader byline → that author's bookshelf
- Author profile manuscripts column header → `New book`

## 9a. Cover images

A book's cover is either an **uploaded image** or the **generated design**, and
the two are mutually exclusive. `book.cover` absent means "no image" — the same
meaning `coverUrl: null` used to carry, so `BookCoverOrFallback` still works.

**Binary in the document, deliberately.** `Book.cover` is
`{ data: Buffer, contentType, size, updatedAt }`, capped at `MAX_COVER_BYTES`
(1 MB). A 1 MB cap is what makes this defensible: Mongo's BSON limit is 16 MB,
so one cover per book is comfortable. It is still the wrong shape for a fleet
of images — **move to GridFS or object storage the moment covers get larger,
more numerous, or CDN-served.** The `MAX_COVER_BYTES` doc comment says so too.

**`toJSON` strips `cover.data`.** The single most load-bearing line in
`Book.js`. Without it a 40-book shelf would inline 40 MB of thumbnails. Book
JSON carries only `{ contentType, size, updatedAt }`; the *presence* of that
subdocument means "there is an image".

**The 1 MB cap is enforced in three places, on purpose:**

| Where | What it catches |
|---|---|
| `payload.maxBytes` on the upload route | Oversized body rejected on content-length, before buffering |
| `request.payload.length` re-check | A chunked request that under-reports content-length |
| `coverSchema` `pre('validate')` hook | A cover written by a migration, script, or future import — never a route |

The schema guard checks `data.length` against the cap **and** requires
`size === data.length`. Checking `size` alone would be theatre: it is metadata,
so a 5 MB buffer paired with `size: 100` satisfies any cap written against it.
Validating the buffer makes the limit a property of the data rather than a
promise about who calls the API.

Mongoose 9 note if you extend this: `Schema.prototype.validate` no longer
exists, and the subdocument `pre('validate')` hook is **async with no `next`**
argument — passing one throws `next is not a function`.

**Uploads are raw bytes, never base64.** base64 inflates by a third, so a 1 MB
image would need a 1.4 MB allowance to honour a 1 MB cap. `apiFetch({raw: true})`
exists for this — `JSON.stringify(file)` is `{}`, which silently uploads nothing.

**Covers are not plain `<img src>`.** `GET /api/books/:id/cover` requires a
bearer token, and `<img>` sends none, so it would 401. `useCoverImage` fetches
the bytes with the auth header and hands back an object URL. It caches the
**Blob** and derives the URL per mount — caching the URL string would return a
revoked URL on remount and render a broken image with no refetch to fix it.

### An uploaded cover is a *background*, not a replacement

The image does not replace the design — it sits **behind** the title, rule, and
mark, which stay legible on top of it. `BookCover` composes three layers in
this order, and the order is the whole trick:

```
<img>  →  scrim  →  type
```

`BookCover({ book, coverSrc })` takes the object URL as `coverSrc`; the existing
generated design is the same component with no `coverSrc`, so preview, profile
thumbnail (`compact`), and the public cover cannot drift apart.

**The scrim is built from `coverColor`, never `textColor`.** `coverColor` is
what the author picked for the *background*, so veiling the image with it keeps
the author's palette and still darkens or lightens toward the type colour.
`withAlpha(hex, alpha)` in `bookDesign.js` does the conversion — the scrim is a
CSS gradient, not an opaque panel, so the artwork stays visible around the type.
Its shape is layout-aware: `top-left` veils the top, `bottom-left` the bottom,
`centered` the middle, `mark-only` only the mark. Verified on rendered pixels
across 24 layout/colour combinations at 4.5:1 contrast; with no `coverSrc` the
scrim is not rendered at all, so the no-image design is unchanged.

`BookForm` calls `useCoverImage` once and passes the result down to both the
live preview and `CoverDesigner`, so the cover the author sees while editing is
the cover that gets saved.

## 9b. ⚠️ Never compare `.author.toString()`

`Book.author` is an `ObjectId` until someone calls `.populate()`, after which it
is a **full User document**. `String(populatedDoc)` is the whole object, not its
id, so this fails silently on every populated book:

```js
book.author.toString() === user._id.toString()   // false when populated
```

It reads as *"the author does not own their own book"*, not as a type error —
and it only fires on non-public books, because `isVisibleTo` short-circuits on
`public` first. That hid it: the profile list never hit it, `GET /api/books/:id`
on an unlisted/private book did. Use `sameAuthorId(ref, userId)` from
`models/Book.js`, which handles both shapes. Same trap applies to any future
`author`/`user` comparison on a populated document.

## 10. Known issues (all cosmetic, none blocking)

- **Mobile overflow at 390px** in the shell pages. Pre-existing. The zen reader
  is clean at 390.
- **Contrast audit**: 103 light + 4 dark findings, vs a 93-light baseline before
  the new pages. The 4 dark ones are a single decorative ghost `J` letter
  (`aria-hidden`). The light delta is decorative separators plus an existing
  `text-zinc-500`-on-`zinc-100` pattern at 4.40:1. None is real body copy.
- **Lint**: 0 errors, 3 known `fast-refresh` warnings — `ui/button.jsx`,
  `ui/badge.jsx`, `lib/theme.jsx` (provider + hook in one file). Harmless.
- **RSS button** on the author profile is decorative, no handler.
- **Cover images have no resize/thumbnail pipeline.** A 1 MB original is served
  at full size to every cover slot, including the 80px profile thumbnail. Fine at
  1 MB, wasteful at volume — sharp/thumbnail generation is the fix once covers
  are common.
- `/circles`, `/notifications`, `/settings` are still thin placeholder pages.
- Vite HMR goes stale sometimes in this session and throws
  `Can't find variable: X` for an import that is actually fine. Fix is
  `pkill -f vite && rm -rf node_modules/.vite && npm run dev`, not a code change.
  Don't chase it.
- The sidebar collapses to a 68px icon rail (`store/ui.js`, Cmd/Ctrl+B). The
  three width strings are duplicated literals in `store/ui.js` on purpose —
  Tailwind only emits CSS for class names it can see in source, so
  `left-[${n}px]` generates nothing. Change all three together.

## 11. Verification tooling

Playwright scripts live **outside the repo** in the temp dir — they are throwaway,
so they are listed here because they will be gone after a reboot:

```
/var/folders/n2/.../T/opencode/pwtest/
  render.mjs      15 routes, 0 failing
  interact.mjs    28 checks, 0 failing
  pages.mjs       Library/Page flows
  theme.mjs       light + dark
  contrast.mjs    colour audit
```

They expect the dev server on **5173** (this was corrected from 5199).
If you want a real safety net, port these into the repo as `e2e/` with Playwright
as a devDependency — right now the only automated coverage is these ad-hoc scripts.

## 12. Backend plan for session 2

Ordered by dependency. Steps 1–3 are prerequisites for the rest.

**1. Git + baseline first**
`git init`, commit the working frontend. Everything below is easier to roll back
from a known-good commit.

**2. Decide the stack and scaffold the server.**
Nothing here is decided yet. Whatever is chosen, the constraint is that
`src/data/books.js` must remain the *only* consumer-facing interface. Keep the
same export names (`books`, `authors`, `getAuthor`, `getBook`, `getPage`,
`getShelf`, `getResumeTarget`, `getLibrary`…) and the same returned shapes, then
swap the module body from literals to fetches. Every page then keeps working
untouched. **This is the highest-leverage decision in the whole plan** — resist
introducing a new client-side data layer or a state manager at the same time.

**3. Schema.** Mirror §6 exactly.
- `authors` (id, username unique, name, bio, location, joined_at, verified,
  portrait_url) + `author_aliases` (author_id, alias unique)
- `books` (id, author_id FK, title, subtitle, blurb, glyph, mark, tag, status,
  pages, current_page, cover_url, published_at)
- `genres` + `book_genres` join
- `pages` (id, book_id FK, ordinal, title, body, read_time, mood) with
  `unique(book_id, ordinal)` — this is what makes per-book page ids safe
- `annotations` (id, book_id FK, page_id FK, author_id FK, body, likes, created_at)
- `follows` (follower_id, followee_id, composite PK)
- `bookmarks` (user_id, book_id, page_id)
- Counts that are currently denormalized on the record (`reads`, `likes`,
  `followers`, `words`, `streak`) should become views or counters incremented
  on write, not columns the client can drift.

**4. Auth.** Every page currently hardcodes Jay as the signed-in user —
`isOwner` in `BookPage`, the Header avatar, `getResumeTarget` in
`src/data/books.js`. Introduce a session and thread `currentUser` through; this
is the change most likely to ripple.

**5. Port the localStorage keys to server state**, one at a time, keeping the
localStorage read as a fallback until each is done:
- `folio:followed` → `follows` (easiest, lowest risk)
- `folio:bookmark:*` → `bookmarks`
- ~~`folio:new-book`~~ **done** — real `POST /books`, redirect to
  `/write?book=<id>`
- `folio:zen` is genuinely per-device and should **stay in localStorage** —
  don't put it in the DB

**6. Images.** Replace every `picsum.photos` URL with real uploads
(authors' portraits, book covers). Note `cover: null` is a meaningful state that
triggers the glyph fallback — preserve it, don't default it to a broken URL.

**7. Then and only then:** rebuild `/circles`, `/notifications`, `/settings`,
and give the RSS button a real feed. These all want live data and were left thin
for exactly that reason.

## 13. Product decisions already made (do not relitigate)

- Product is **Folio**, tagline "One page at a time".
- Motto on the home rail: `"A writer only knows writing."`
- Strict monochrome, no accent color.
- Real catalog data only — no fabricated translations or testimonial prose, even
  when a mockup contained them. Mockup copy was treated as layout, not content.
- Small functional changes preferred over UI churn.
