import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bookmark,
  BookOpen,
  Check,
  Feather,
  Flame,
  MapPin,
  MessageSquare,
  Pin,
  Plus,
  Quote,
  Rss,
  Share2,
  Star,
  Terminal,
} from "lucide-react";
import { books, getAuthor, getBook, annotations, recentReaders, compact } from "@/data/books";
import { GLYPHS } from "@/lib/glyphs";

const TABS = [
  { key: "published", label: "Published Bookshelf", icon: BookOpen, heading: "Active Manuscripts" },
  { key: "drafts", label: "Drafts & WIPs", icon: Feather, heading: "In Progress" },
  { key: "excerpts", label: "Highlighted Verses", icon: Quote, heading: "Highlighted Verses" },
  { key: "endorsements", label: "Endorsements", icon: Star, heading: "Reader Endorsements" },
];

// Reader state is local to the session; there is no backend to persist to.
const FOLLOWED_KEY = "folio:followed";

function readFollowed() {
  try {
    return JSON.parse(localStorage.getItem(FOLLOWED_KEY) || "[]");
  } catch {
    return [];
  }
}

function AuthorProfilePage() {
  const { username } = useParams();
  const author = useMemo(() => getAuthor(username ?? "jay"), [username]);

  const [tab, setTab] = useState("published");
  const [following, setFollowing] = useState(() => readFollowed().includes(username ?? "jay"));
  const [copied, setCopied] = useState(false);

  if (!author) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <h1 className="font-heading text-2xl text-zinc-950">No such author</h1>
        <p className="mt-2 font-body text-sm text-zinc-600">
          Nobody on Folio is writing as &ldquo;{username}&rdquo;.
        </p>
        <Link
          to="/discover"
          className="mt-5 inline-block rounded-lg bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white"
        >
          Browse discover
        </Link>
      </div>
    );
  }

  const owned = books.filter((b) => b.author === author.key);
  const published = owned.filter((b) => b.status !== "draft");
  const drafts = owned.filter((b) => b.status === "draft");
  const penned = owned.reduce((n, b) => n + b.pages, 0);
  const readership = owned.reduce((n, b) => n + b.reads, 0);
  const applause = owned.reduce((n, b) => n + b.likes, 0);

  // The pinned excerpt is a real page from the author's first published book.
  const pinnedBook = published[0];
  const pinned = pinnedBook ? getBook(pinnedBook.id).pagesList[0] : null;

  const toggleFollow = () => {
    const handle = username ?? "jay";
    setFollowing((was) => {
      const next = !was;
      try {
        const list = readFollowed();
        localStorage.setItem(
          FOLLOWED_KEY,
          JSON.stringify(next ? [...new Set([...list, handle])] : list.filter((u) => u !== handle))
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${author.name} (@${author.username})`, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-6">
      {/* Console ticker */}
      <div className="-mx-6 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-6 py-2.5 sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-2 font-code text-[11px] uppercase tracking-widest text-zinc-600">
          <Link to="/" className="hover:text-zinc-950">
            Feed
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/discover" className="hover:text-zinc-950">
            Authors
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-zinc-950">
            {author.name} (@{author.username})
          </span>
        </div>
        <div className="flex items-center gap-4 font-code text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5 uppercase tracking-widest">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-950" />
            Terminal draft active
          </span>
          <span className="hidden sm:inline">Ahmedabad desk</span>
        </div>
      </div>

      {/* Author identifier */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 p-6 shadow-sm sm:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-0 select-none font-heading text-[10rem] leading-none text-zinc-200 opacity-70 sm:text-[14rem]"
        >
          {author.name.charAt(0)}
        </span>

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-zinc-200 sm:h-32 sm:w-32">
              <img
                src={author.portrait}
                alt={author.name}
                className="h-full w-full object-cover opacity-90 grayscale"
                loading="lazy"
              />
              <span className="absolute bottom-0 right-0 bg-zinc-950 px-1.5 py-0.5 font-code text-[9px] uppercase tracking-widest text-white">
                ID-{author.key.slice(0, 4).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-zinc-950 sm:text-4xl">
                  {author.name}
                </h1>
                {author.verified && (
                  <span className="rounded bg-zinc-950 px-2 py-0.5 font-code text-[11px] uppercase tracking-wider text-white">
                    Author verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 font-code text-[11px] uppercase tracking-wider text-zinc-600">
                <span className="text-zinc-950">@{author.username}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-400" aria-hidden="true" />
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {author.location}
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-400" aria-hidden="true" />
                <span>Joined {author.joined}</span>
              </div>
              <p className="mt-1 max-w-2xl font-body text-base leading-relaxed text-zinc-700">
                {author.bio}{" "}
                {pinnedBook && (
                  <em className="font-body text-lg italic">
                    Currently binding &ldquo;{pinnedBook.title}&rdquo;.
                  </em>
                )}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <button
              type="button"
              onClick={toggleFollow}
              aria-pressed={following}
              className={`flex flex-1 items-center justify-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors sm:flex-initial ${
                following
                  ? "bg-zinc-200 text-zinc-950 hover:bg-zinc-300"
                  : "bg-zinc-950 text-white hover:bg-zinc-800"
              }`}
            >
              {following ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {following ? "Following" : "Follow author"}
            </button>
            <button
              type="button"
              onClick={share}
              aria-label="Share this bookshelf"
              className="bg-zinc-200 p-2.5 text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              aria-label="RSS feed"
              className="bg-zinc-200 p-2.5 text-zinc-900 transition-colors hover:bg-zinc-300"
            >
              <Rss className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Telemetry tape */}
      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Bound folios", value: String(published.length).padStart(2, "0"), unit: "volumes" },
          { label: "Total penned", value: String(penned), unit: "pages" },
          { label: "Readership", value: compact(readership), unit: "active" },
          { label: "Focus streak", value: String(author.streak), unit: "days", icon: Flame },
          { label: "Reader echo", value: compact(applause), unit: "applause" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-center border-b border-r border-zinc-700 p-4 last:border-r-0 sm:[&:nth-child(3n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(3n)]:border-r lg:last:border-r-0"
          >
            <span className="font-code text-[10px] uppercase tracking-widest text-zinc-200">
              {stat.label}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-heading text-2xl font-bold text-white sm:text-3xl">{stat.value}</span>
              <span className="flex items-center gap-0.5 font-code text-[10px] uppercase tracking-wider text-zinc-200">
                {stat.icon && <stat.icon className="h-3 w-3" aria-hidden="true" />}
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Workspace tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1">
        {TABS.map((entry) => {
          const count =
            entry.key === "published"
              ? published.length
              : entry.key === "drafts"
                ? drafts.length
                : entry.key === "excerpts"
                  ? published.length
                  : annotations.length;
          const active = tab === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                active
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
              }`}
            >
              <entry.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.label}
              <span className="text-zinc-500">[{count}]</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Primary column */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-zinc-950" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold uppercase tracking-wide text-zinc-950">
                {TABS.find((entry) => entry.key === tab)?.heading}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-code text-[10px] uppercase tracking-widest text-zinc-500 sm:inline">
                Sort: chronological
              </span>
              <Link
                to="/books/new"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New book
              </Link>
            </div>
          </div>

          {(tab === "published" || tab === "drafts" ? (tab === "drafts" ? drafts : published) : []).map(
            (book) => (
              <BookRow key={book.id} book={book} />
            )
          )}

          {tab === "excerpts" &&
            published.map((book) => {
              const page = getBook(book.id).pagesList[0];
              if (!page) return null;
              return (
                <article key={book.id} className="border-l-2 border-zinc-900 bg-zinc-100 p-5">
                  <div className="mb-2 flex items-center justify-between font-code text-[10px] uppercase tracking-widest text-zinc-200">
                    <span>
                      From: {book.title} &middot; Folio {String(page.id).padStart(2, "0")}
                    </span>
                    <span>{book.tag}</span>
                  </div>
                  <p className="font-body text-lg leading-relaxed text-zinc-900">
                    {page.content}
                  </p>
                </article>
              );
            })}

          {tab === "endorsements" &&
            annotations.map((note) => <Endorsement key={note.id} note={note} author={author} />)}

          {(tab === "drafts" ? drafts : tab === "published" ? published : tab === "excerpts" ? published : []).length ===
            0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
              <p className="font-body text-sm text-zinc-600">
                Nothing filed under this tab yet.
              </p>
            </div>
          )}

          {drafts[0] && <DraftSession book={drafts[0]} />}
        </div>

        {/* Secondary column */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {pinned && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Pin className="h-4 w-4 text-zinc-950" aria-hidden="true" />
                <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-zinc-950">
                  Pinned excerpt
                </h3>
              </div>
              <div className="relative overflow-hidden border border-zinc-200 bg-zinc-100 p-6">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-0 select-none font-heading text-7xl leading-none text-zinc-200"
                >
                  &ldquo;
                </span>
                <div className="relative flex items-center justify-between font-code text-[10px] uppercase tracking-widest text-zinc-200">
                  <span>
                    {pinnedBook.title} &middot; Folio {String(pinned.id).padStart(2, "0")}
                  </span>
                  <span>Verse</span>
                </div>
                <blockquote className="relative pt-2">
                  <p className="font-body text-lg leading-loose text-zinc-900">
                    {pinned.content}
                  </p>
                </blockquote>
                <div className="relative mt-4 flex items-center justify-between font-code text-[11px] text-zinc-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-zinc-800">
                      <span aria-hidden="true">&#9829;</span>
                      {pinned.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      {pinned.comments}
                    </span>
                  </div>
                  <Link
                    to={`/book/${pinnedBook.id}/read/${pinned.id}`}
                    className="uppercase tracking-widest text-zinc-900 hover:underline"
                  >
                    Cite folio
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className={tab === "endorsements" ? "hidden" : undefined}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-zinc-950" aria-hidden="true" />
                <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-zinc-950">
                  Reader endorsements
                </h3>
              </div>
              <span className="font-code text-[10px] uppercase tracking-widest text-zinc-500">
                {annotations.length} verified
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {annotations.map((note) => (
                <Endorsement key={note.id} note={note} author={author} />
              ))}
            </div>
          </section>

          <section className="bg-zinc-950 p-5 text-zinc-200">
            <div className="flex items-center justify-between font-code text-[10px] uppercase tracking-widest text-zinc-200">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3" aria-hidden="true" />
                Terminal colophon
              </span>
              <span>Monochrome edition</span>
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-200">
              Set in Gruppo, Nunito and Fira Code. Bound digitally, one folio at a time. Every page on
              Folio is revision-addressable and permanent.
            </p>
          </section>
        </div>
      </div>

      {/* Manuscript counter */}
      <div className="sticky bottom-0 z-30 -mx-6 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-white/95 px-6 py-2.5 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <span className="flex items-center gap-1.5 font-code text-[11px] text-zinc-950">
          <span className="inline-block h-2 w-2 bg-zinc-950" aria-hidden="true" />
          Author status: observing &amp; composing
        </span>
        <div className="flex items-center gap-4 font-code text-[11px] text-zinc-600">
          <span>
            Words total: <strong className="text-zinc-950">{author.words.toLocaleString()}</strong>
          </span>
          <span>
            Circulation:{" "}
            <strong className="text-zinc-950">{readership.toLocaleString()} reads</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// --- pieces ------------------------------------------------------------------

function BookRow({ book }) {
  const Glyph = GLYPHS[book.glyph] ?? BookOpen;
  // "Read book" opens at the furthest page the author has actually written,
  // clamped to the sample pages that exist.
  const list = getBook(book.id).pagesList;
  const readPage = list.length ? Math.min(Math.max(book.currentPage, 1), list.length) : 1;

  return (
    <article className="group flex flex-col gap-6 border border-zinc-200 bg-zinc-100 p-5 transition-colors hover:bg-zinc-200/60 sm:flex-row">
      <Link
        to={`/book/${book.id}`}
        className="relative flex aspect-[3/4] w-full shrink-0 flex-col justify-between overflow-hidden bg-zinc-950 p-4 sm:w-44"
      >
        {book.cover ? (
          <img
            src={book.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
        <div className="relative z-10 flex items-start justify-between">
          <span className="bg-zinc-100 px-1.5 py-0.5 font-code text-[9px] uppercase tracking-widest text-zinc-900">
            Folio-{String(book.id).padStart(2, "0")}
          </span>
          <Glyph className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <div className="relative z-10">
          <span className="mb-1.5 block h-0.5 w-6 bg-white" aria-hidden="true" />
          <h3 className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-white">
            {book.title}
          </h3>
          <p className="mt-1 font-code text-[10px] uppercase tracking-widest text-zinc-200">{book.tag}</p>
        </div>
        <div className="relative z-10 flex justify-between font-code text-[9px] uppercase tracking-widest text-zinc-200">
          <span>{book.genres[0]}</span>
          <span>{book.status === "draft" ? "Draft" : "Bound"}</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-code text-[10px] uppercase tracking-wider text-zinc-800">
              {book.genres[0]}
            </span>
            <span className="font-code text-[10px] uppercase text-zinc-500">
              #{book.status === "draft" ? "in-progress" : "in-circulation"}
            </span>
          </div>
          <h3 className="font-heading text-xl font-semibold uppercase tracking-wide text-zinc-950">
            {book.title}
          </h3>
          <p className="font-body text-sm leading-relaxed text-zinc-600">{book.blurb}</p>
          <div className="mt-1 grid grid-cols-2 gap-3 bg-white p-3">
            <div className="flex flex-col">
              <span className="font-code text-[10px] uppercase text-zinc-500">Folio extent</span>
              <span className="font-heading text-base text-zinc-950">{book.pages} pages</span>
            </div>
            <div className="flex flex-col">
              <span className="font-code text-[10px] uppercase text-zinc-500">Active readership</span>
              <span className="font-heading text-base text-zinc-950">
                {book.reads.toLocaleString()} readers
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {book.status === "draft" ? (
            <Link
              to="/write"
              className="flex flex-1 items-center justify-center gap-2 bg-zinc-950 px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 sm:flex-initial"
            >
              <Feather className="h-3.5 w-3.5" aria-hidden="true" />
              Continue draft
            </Link>
          ) : (
            <Link
              to={`/book/${book.id}/read/${readPage}`}
              className="flex flex-1 items-center justify-center gap-2 bg-zinc-950 px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 sm:flex-initial"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Read book
            </Link>
          )}
          <Link
            to={`/book/${book.id}`}
            className="flex items-center gap-2 bg-zinc-200 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-300"
          >
            View chapters
          </Link>
        </div>
      </div>
    </article>
  );
}

function DraftSession({ book }) {
  const done = book.currentPage;
  const total = book.pages;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="border border-zinc-200 bg-zinc-100 p-5">
      <div className="mb-4 flex items-center justify-between font-code text-[11px] uppercase tracking-widest">
        <span className="text-zinc-950">Current draft activity</span>
        <span className="text-zinc-500">
          Folio {String(book.id).padStart(2, "0")}: &ldquo;{book.title}&rdquo;
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between font-code text-[11px] text-zinc-600">
          <span>
            {done} / {total} folios drafted
          </span>
          <span className="font-bold text-zinc-950">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-zinc-200">
          <div className="h-full bg-zinc-950" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 font-code text-[10px] uppercase tracking-widest text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-950" aria-hidden="true" />
          Auto-saved to vault
        </span>
        <Link to="/write" className="text-zinc-900 hover:underline">
          Inspect ledger &rarr;
        </Link>
      </div>
    </div>
  );
}

function Endorsement({ note, author }) {
  const reader = recentReaders.find((r) => r.name.split(" ")[0] === note.author.split(" ")[0]);
  return (
    <figure className="border border-zinc-200 bg-white p-4">
      <figcaption className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-zinc-200 font-code text-[10px] font-bold text-zinc-900">
            {note.author.charAt(0)}
          </span>
          <span className="font-code text-[11px] font-bold uppercase tracking-wider text-zinc-950">
            {note.author}
          </span>
        </div>
        <span className="font-code text-[10px] uppercase text-zinc-500">{note.time}</span>
      </figcaption>
      <blockquote className="mt-2 font-body text-sm leading-relaxed text-zinc-700">
        &ldquo;{note.text}&rdquo;
      </blockquote>
      <p className="mt-2 flex items-center gap-1.5 font-code text-[10px] uppercase tracking-widest text-zinc-500">
        <span>On: {author.name}</span>
        <span aria-hidden="true">&middot;</span>
        <span className="text-zinc-800">
          {reader ? `Verified reader ${reader.id}` : "Verified reader"}
        </span>
      </p>
    </figure>
  );
}

export { AuthorProfilePage };
