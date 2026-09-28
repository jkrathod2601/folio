import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Feather,
  ListOrdered,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { useBook } from "@/hooks/useBooks";
import { usePages } from "@/hooks/usePages";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { BookCoverOrFallback } from "@/components/BookCover";
import { cn } from "@/lib/utils";

/**
 * A book's page — the public face of a manuscript.
 *
 * Layout follows the product's book-page design: a sticky left column holding
 * the cover and everything known about the book (author, synopsis, metrics,
 * genres, the story bible), and a right column streaming the published pages.
 *
 * Only real data is shown. The reader/like counts and reading progress in the
 * old mock design have no backend, so the metrics grid reports what actually
 * exists — page count, published pages, and total words — rather than
 * invented social proof.
 *
 * The story bible (characters, places, sections) is the author's private
 * outline, so it is fetched only when the signed-in user is the book's author.
 * A reader never sees it.
 */

const GENRE_CHIPS = 6;
const countWords = (text) => (text ?? "").trim().split(/\s+/).filter(Boolean).length;

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// --- story bible ------------------------------------------------------------

/** The author's outline. Owner-only, so the query is gated on authorship. */
function useStoryBible(bookId, isOwner) {
  const enabled = Boolean(bookId && isOwner);
  const query = (kind) => ({
    queryKey: ["books", bookId, kind],
    enabled,
    queryFn: () => api.get(`/books/${bookId}/${kind}`).then((r) => r[kind] ?? []),
  });
  return {
    characters: useQuery(query("characters")),
    places: useQuery(query("places")),
    sections: useQuery(query("sections")),
  };
}

function StoryBibleSection({ icon: Icon, label, items, empty }) {
  // `undefined` means still loading; `[]` means loaded and empty.
  if (items === undefined) return null;
  return (
    <div className="border-t border-zinc-100 pt-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-black" />
        <h3 className="font-heading text-sm uppercase tracking-wider text-black">{label}</h3>
        <span className="ml-auto font-mono text-[10px] text-zinc-400">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id ?? item.key}
              className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2"
            >
              {item.mood && <span className="text-sm">{item.mood}</span>}
              <span className="truncate font-body text-sm font-medium text-zinc-800">
                {item.name || item.title}
              </span>
              {item.role && (
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  {item.role}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 font-body text-xs text-zinc-400">{empty}</p>
      )}
    </div>
  );
}

// --- cover ------------------------------------------------------------------

function HeroCover({ book }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
      <BookCoverOrFallback book={book} className="w-full" />
    </div>
  );
}

// --- author / info card -----------------------------------------------------

function AuthorCard({ book, isOwner }) {
  const pages = usePages(book.id).data ?? [];
  const published = pages.filter((p) => p.status === "published").length;
  const words = pages.reduce((sum, p) => sum + countWords(p.body), 0);
  const publishedDate = formatDate(book.publishedAt) ?? formatDate(book.createdAt);
  const { characters, places, sections } = useStoryBible(book.id, isOwner);

  const metrics = [
    { label: "Pages", value: String(book.pageCount) },
    { label: "Published", value: String(published) },
    { label: "Words", value: words.toLocaleString() },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6">
      {/* author identity */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 font-mono-code text-sm font-semibold text-zinc-900 shadow-inner">
          {book.author?.portraitUrl ? (
            <img src={book.author.portraitUrl} alt="" className="h-full w-full object-cover grayscale" />
          ) : (
            (book.author?.name ?? "?").charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-body text-sm font-bold leading-snug text-zinc-900">
            {book.author?.name ?? "Unknown"}
          </h2>
          <span className="font-mono-code text-xs text-zinc-400">@{book.author?.username ?? "unknown"}</span>
        </div>
        {isOwner && (
          <Link
            to={`/books/${book.id}/edit`}
            className="ml-auto shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Edit
          </Link>
        )}
      </div>

      {/* synopsis */}
      {book.blurb && (
        <p className="font-body text-xs leading-relaxed text-zinc-600">{book.blurb}</p>
      )}

      {/* metrics */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 text-center"
          >
            <div className="font-mono-code text-base font-semibold text-zinc-900">{m.value}</div>
            <div className="mt-0.5 font-mono-code text-[9px] uppercase tracking-wider text-zinc-500">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* genres + meta */}
      <div className="flex flex-wrap items-center gap-2">
        {book.genres?.slice(0, GENRE_CHIPS).map((g) => (
          <span
            key={g}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600"
          >
            {g}
          </span>
        ))}
      </div>

      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Status</dt>
          <dd
            className={cn(
              "rounded px-1.5 py-0.5 font-semibold",
              book.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-200 text-zinc-700",
            )}
          >
            {book.status}
          </dd>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <dt className="sr-only">Published</dt>
          <dd>{publishedDate ?? "—"}</dd>
        </div>
        {book.language && (
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <dt className="sr-only">Language</dt>
            <dd>{book.language}</dd>
          </div>
        )}
      </dl>

      {/* story bible — the author's private outline */}
      {isOwner && (
        <div className="space-y-4">
          <StoryBibleSection icon={Users} label="Characters" items={characters.data} empty="No characters yet." />
          <StoryBibleSection icon={MapPin} label="Places" items={places.data} empty="No places yet." />
          <StoryBibleSection icon={ListOrdered} label="Outline" items={sections.data} empty="No sections yet." />
          {(characters.isLoading || places.isLoading || sections.isLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" aria-label="Loading story bible" />
          )}
        </div>
      )}
    </div>
  );
}

// --- page row ---------------------------------------------------------------

function PageRow({ bookId, page, index }) {
  const date = formatDate(page.updatedAt);
  return (
    <Link
      to={`/book/${bookId}/read/${page.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:border-zinc-400"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-100 font-mono-code text-xs font-semibold text-zinc-700">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="flex items-center gap-1.5 font-body text-base font-bold text-zinc-900 transition-colors group-hover:text-black">
            <span className="truncate">{page.title || "Untitled Page"}</span>
            {page.mood && <span className="text-sm">{page.mood}</span>}
            {page.status === "draft" && (
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-zinc-600">
                Draft
              </span>
            )}
          </h3>
          <span className="flex shrink-0 items-center gap-1 font-mono-code text-xs text-zinc-400">
            <Clock className="h-3 w-3" />
            {page.readMinutes} min
          </span>
        </div>

        {page.body && (
          <p className="line-clamp-3 font-body text-sm leading-relaxed text-zinc-700">{page.body}</p>
        )}

        <div className="flex items-center gap-5 pt-1 font-mono-code text-xs text-zinc-400">
          {date && <span>{date}</span>}
        </div>
      </div>
    </Link>
  );
}

// --- states -----------------------------------------------------------------

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" aria-label="Loading book" />
      <p className="font-code text-xs text-zinc-500">Loading book…</p>
    </div>
  );
}

function Refusal({ heading, body }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl uppercase tracking-wide text-zinc-950">{heading}</h1>
      <p className="mt-2 font-body text-sm text-zinc-600">{body}</p>
      <Link
        to="/library"
        className="mt-5 inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-950"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Back to the library
      </Link>
    </div>
  );
}

// --- page -------------------------------------------------------------------

function BookPage() {
  const { id } = useParams();
  const bookQuery = useBook(id);
  const pagesQuery = usePages(id);
  const user = useAuthStore((st) => st.user);
  const [expanded, setExpanded] = useState(false);

  if (bookQuery.isLoading) return <Loading />;

  // 404 and 403 land here too, and the server's message is the useful one.
  if (bookQuery.isError) {
    const status = bookQuery.error?.status;
    return (
      <Refusal
        heading={status === 403 ? "This book is private" : "No such book"}
        body={bookQuery.error.message}
      />
    );
  }

  const book = bookQuery.data;
  const isOwner = Boolean(user && book.author?.id === user.id);
  // The book page is the public face: only published pages are listed. Drafts
  // are the author's working notes — managed in the studio, never here.
  const pages = (pagesQuery.data ?? []).filter((p) => p.status === "published");
  const visible = expanded ? pages : pages.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-[1500px] p-8">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        {/* left: cover + everything known about the book */}
        <section className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
          <HeroCover book={book} />
          <AuthorCard book={book} isOwner={isOwner} />
        </section>

        {/* right: pages stream */}
        <section className="space-y-5 lg:col-span-8">
          <div className="flex items-baseline justify-between border-b border-zinc-200/80 pb-4">
            <h2 className="font-heading text-2xl tracking-wide text-zinc-900 md:text-3xl">Pages</h2>
            <span className="font-mono-code text-xs text-zinc-400">
              {pages.length} {pages.length === 1 ? "page" : "pages"}
            </span>
          </div>

          {pagesQuery.isLoading ? (
            <Loading />
          ) : pages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <Feather className="mx-auto mb-3 h-8 w-8 text-zinc-300" aria-hidden="true" />
              <h3 className="font-heading text-lg text-zinc-950">
                {isOwner ? "No pages yet" : "No published pages yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm font-body text-sm text-zinc-500">
                {isOwner
                  ? "Write your first page in the studio."
                  : "The author hasn't published any pages yet."}
              </p>
              {isOwner && (
                <Link
                  to={`/write?book=${book.id}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
                >
                  <Feather className="h-3.5 w-3.5" />
                  Open the studio
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {visible.map((page, index) => (
                  <PageRow key={page.id} bookId={book.id} page={page} index={index} />
                ))}
              </div>

              {pages.length > 5 && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-2.5 font-mono-code text-xs text-zinc-600 shadow-sm transition-colors hover:border-black hover:text-black"
                  >
                    {expanded ? "Show less" : "Load more excerpts"}
                    <span aria-hidden="true">{expanded ? "↑" : "↓"}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export { BookPage };
