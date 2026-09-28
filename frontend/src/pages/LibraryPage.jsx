import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Library, Loader2, Search } from "lucide-react";
import { usePublicBooks } from "@/hooks/useBooks";
import { BookCover } from "@/components/BookCover";
import { cn } from "@/lib/utils";

/**
 * The library — every published, public book on Folio.
 *
 * This is the public catalog, not a personal shelf: it lists what authors
 * have chosen to publish, so a reader can find something to read. The data
 * comes from `GET /api/books/discover`, which filters server-side on
 * `status: published, visibility: public`.
 *
 * Cards open the real book page at `/book/:id`.
 */

const GENRE_CHIPS = 3;

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// --- catalog card -----------------------------------------------------------

function CatalogCard({ book }) {
  const published = formatDate(book.publishedAt) ?? formatDate(book.createdAt);

  return (
    <Link
      to={`/book/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-400"
    >
      <BookCover book={book} className="w-full border-0 border-b border-zinc-200" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base uppercase leading-snug tracking-wide text-zinc-950">
            {book.title}
          </h3>
          {book.status === "published" && (
            <span className="mt-0.5 shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
              Live
            </span>
          )}
        </div>

        <p className="font-code text-xs text-zinc-500">
          by {book.author?.name ?? "Unknown"}
        </p>

        {book.blurb && (
          <p className="line-clamp-3 font-body text-sm leading-relaxed text-zinc-600">
            {book.blurb}
          </p>
        )}

        {book.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {book.genres.slice(0, GENRE_CHIPS).map((g) => (
              <span
                key={g}
                className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600"
              >
                {g}
              </span>
            ))}
            {book.genres.length > GENRE_CHIPS && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                +{book.genres.length - GENRE_CHIPS}
              </span>
            )}
          </div>
        )}

        <dl className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 font-code text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Pages</dt>
            <dd>
              {book.pageCount} {book.pageCount === 1 ? "page" : "pages"}
            </dd>
          </div>
          <div className="h-3 w-px bg-zinc-200" />
          <div>
            <dt className="sr-only">Published</dt>
            <dd>{published ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

// --- states -----------------------------------------------------------------

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" aria-label="Loading books" />
      <p className="font-code text-xs text-zinc-500">Fetching the catalog…</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <BookOpen className="mx-auto mb-3 h-8 w-8 text-zinc-300" aria-hidden="true" />
      <h3 className="font-heading text-lg text-zinc-950">Could not load the library</h3>
      <p className="mt-1 font-body text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
      <Library className="mx-auto mb-3 h-8 w-8 text-zinc-300" aria-hidden="true" />
      <h3 className="font-heading text-lg text-zinc-950">Nothing published yet</h3>
      <p className="mx-auto mt-1 max-w-sm font-body text-sm text-zinc-500">
        When an author publishes a book and makes it public, it appears here.
      </p>
      <Link
        to="/profile"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
      >
        Start writing
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// --- page -------------------------------------------------------------------

function LibraryPage() {
  const { data: books, isLoading, isError, error } = usePublicBooks();
  const [query, setQuery] = useState("");

  // A local filter over what the server returned, not a search endpoint:
  // the catalog is bounded at 50 books server-side, and re-querying on every
  // keystroke would make the search feel slower than it is.
  const visible = useMemo(() => {
    const all = books ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.name?.toLowerCase().includes(q) ||
        b.genres?.some((g) => g.toLowerCase().includes(q)),
    );
  }, [books, query]);

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Public catalog
          </p>
          <h1 className="font-heading text-4xl text-zinc-950">Bookshelf</h1>
          <p className="mt-1 font-body text-sm text-zinc-500">
            Every published, public book on Folio.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title, author, genre…"
              aria-label="Filter books"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 font-body text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-500 sm:w-64"
            />
          </div>
          <span className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-600">
            {visible.length} {visible.length === 1 ? "book" : "books"}
          </span>
        </div>
      </header>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState message={error?.message ?? "Something went wrong."} />
      ) : visible.length === 0 ? (
        query ? (
          <div className="mx-auto max-w-md rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-zinc-300" aria-hidden="true" />
            <h3 className="font-heading text-lg text-zinc-950">No matches</h3>
            <p className="mt-1 font-body text-sm text-zinc-500">
              Nothing in the catalog matches “{query}”.
            </p>
          </div>
        ) : (
          <EmptyState />
        )
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {visible.map((book) => (
            <CatalogCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

export { LibraryPage };
