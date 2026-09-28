import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Feather,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Globe,
  Link2,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useMyBooks } from "@/hooks/useBooks";
import { BookCoverOrFallback } from "@/components/BookCover";
import { AdminBadge } from "@/components/AdminBadge";
import { cn } from "@/lib/utils";

/**
 * Your own profile: real data, from the API.
 *
 * This is deliberately a different page from `AuthorProfilePage`. That one is
 * still reading the mock catalog, so putting real books into its mock-shaped
 * layout would mean either a second source of truth on one page or a half-migrated
 * one. Splitting them means `/profile` is trustworthy and `/author/:username`
 * keeps its mock presentation until the authors endpoint exists.
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
];

const VISIBILITY = {
  public: { label: "Public", icon: Globe },
  unlisted: { label: "Unlisted", icon: Link2 },
  private: { label: "Private", icon: Lock },
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
};

function Stat({ label, value, unit }) {
  return (
    <div className="flex flex-col justify-center border-r border-zinc-700 p-4 last:border-r-0">
      <span className="font-code text-[10px] uppercase tracking-widest text-zinc-200">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-heading text-2xl font-bold text-white sm:text-3xl">
          {value}
        </span>
        {unit && (
          <span className="font-code text-[10px] uppercase tracking-wider text-zinc-200">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }) {
  const visibility = VISIBILITY[book.visibility] ?? VISIBILITY.unlisted;
  const Icon = visibility.icon;

  return (
    <li className="group flex gap-4 border-b border-zinc-100 p-4 last:border-0 hover:bg-zinc-50">
      <BookCoverOrFallback
        book={book}
        className="w-20 shrink-0 border border-zinc-200"
        compact
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-heading text-base font-semibold uppercase tracking-wide text-zinc-950">
              {book.title}
            </h3>
            {book.status === "draft" && (
              <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-code text-[9px] uppercase tracking-wider text-zinc-500">
                Draft
              </span>
            )}
          </div>

          {book.subtitle && (
            <p className="mt-0.5 truncate font-body text-xs italic text-zinc-600">
              {book.subtitle}
            </p>
          )}

          {book.genres?.length > 0 && (
            <p className="mt-1.5 truncate font-code text-[10px] uppercase tracking-wider text-zinc-500">
              {book.genres.join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 font-code text-[10px] uppercase tracking-wider text-zinc-500">
          <span className="flex items-center gap-1">
            <Icon className="h-3 w-3" aria-hidden="true" />
            {visibility.label}
          </span>
          <span aria-hidden="true">/</span>
          <span>
            {book.pageCount} {book.pageCount === 1 ? "page" : "pages"}
          </span>
          {book.mark && (
            <>
              <span aria-hidden="true">/</span>
              <span>{book.mark}</span>
            </>
          )}

          {/* Edit lives here rather than on a book page, because `/book/:id` is
              still a mock route — there is no real book page to edit *from* yet.
              This is the one action that does not need that route to exist. */}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link
              to={`/books/${book.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-zinc-700 transition-colors hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Edit
              <span className="sr-only">{book.title}</span>
            </Link>
          </span>
        </div>
      </div>
    </li>
  );
}

function MyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data: books, isLoading, error } = useMyBooks();
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const list = books ?? [];
    return {
      all: list.length,
      published: list.filter((b) => b.status === "published").length,
      draft: list.filter((b) => b.status === "draft").length,
    };
  }, [books]);

  const visible = (books ?? []).filter((b) =>
    filter === "all" ? true : b.status === filter
  );

  const totalPages = (books ?? []).reduce((n, b) => n + (b.pageCount ?? 0), 0);
  const name = user?.name || user?.email?.split("@")[0] || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Console ticker */}
      <div className="-mx-6 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-6 py-2.5 sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2 font-code text-[11px] uppercase tracking-widest text-zinc-600">
          <Link to="/" className="hover:text-zinc-950">
            Feed
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-zinc-950">Your profile</span>
        </div>
        <span className="font-code text-[11px] uppercase tracking-widest text-zinc-500">
          Signed in
        </span>
      </div>

      {/* Identifier */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-6 shadow-sm sm:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-0 select-none font-heading text-[10rem] leading-none text-zinc-200 opacity-70 sm:text-[14rem]"
        >
          {initial}
        </span>

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-zinc-200 sm:h-32 sm:w-32">
              {user?.portraitUrl ? (
                <img
                  src={user.portraitUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-90 grayscale"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center font-heading text-4xl text-zinc-400"
                >
                  {initial}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-zinc-950 sm:text-4xl">
                  {name}
                </h1>
                {user?.role === "admin" && <AdminBadge role="admin" />}
                {user?.verified && (
                  <span className="rounded bg-zinc-950 px-2 py-0.5 font-code text-[11px] uppercase tracking-wider text-white">
                    Verified
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 font-code text-[11px] uppercase tracking-wider text-zinc-600">
                {user?.username && (
                  <>
                    <span className="text-zinc-950">@{user.username}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-400" aria-hidden="true" />
                  </>
                )}
                {user?.location && (
                  <>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {user.location}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-400" aria-hidden="true" />
                  </>
                )}
                <span>Joined {formatDate(user?.joined)}</span>
              </div>

              {user?.bio ? (
                <p className="mt-1 max-w-2xl font-body text-base leading-relaxed text-zinc-700">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-1 max-w-2xl font-body text-sm italic text-zinc-500">
                  No bio yet. Your profile is visible to nobody but you.
                </p>
              )}
            </div>
          </div>

          <Link
            to="/books/new"
            className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 lg:w-auto"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New book
          </Link>
        </div>
      </section>

      {/* Telemetry */}
      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 sm:grid-cols-4">
        <Stat label="Books" value={String(counts.all).padStart(2, "0")} unit="total" />
        <Stat label="Published" value={String(counts.published).padStart(2, "0")} unit="live" />
        <Stat label="Drafts" value={String(counts.draft).padStart(2, "0")} unit="wip" />
        <Stat label="Total penned" value={String(totalPages)} unit="pages" />
      </section>

      {/* Filters */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
                active
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
              )}
            >
              {f.label}
              <span className="text-zinc-500">[{counts[f.key]}]</span>
            </button>
          );
        })}
      </div>

      {/* Books */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-16 font-mono text-xs uppercase tracking-wider text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your books
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="font-body text-sm font-semibold text-zinc-950">
            Could not load your books
          </p>
          <p className="mt-1 font-code text-xs text-zinc-500">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          {filter === "all" ? (
            <Feather className="h-5 w-5 text-zinc-300" />
          ) : (
            <BookOpen className="h-5 w-5 text-zinc-300" />
          )}
          <p className="font-body text-sm text-zinc-600">
            {counts.all === 0
              ? "You have not written anything yet."
              : `No ${filter === "draft" ? "drafts" : "published books"} yet.`}
          </p>
          {counts.all === 0 && (
            <Link
              to="/books/new"
              className="rounded-lg bg-zinc-950 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
            >
              Bind your first book
            </Link>
          )}
        </div>
      )}

      {visible.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {visible.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </ul>
      )}

      {user?.role === "admin" && (
        <Link
          to="/admin"
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Administration
        </Link>
      )}
    </div>
  );
}

export { MyProfilePage };
