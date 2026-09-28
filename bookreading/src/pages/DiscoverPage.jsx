import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  LockOpen,
  Pencil,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { GLYPHS } from "@/lib/glyphs";
import { authors, books, compact, genres, risers } from "@/data/books";

// ---------------------------------------------------------------------------
// Catalog lives in src/data/books.js so Discover and /book/:id stay in sync.
// ---------------------------------------------------------------------------
const featured = books.map((book) => ({
  ...book,
  author: authors[book.author].name,
  icon: GLYPHS[book.glyph],
}));

const releases = books.map((book) => ({
  ...book,
  author: authors[book.author].name,
  pages: `${book.pages} pages`,
  reads: `${compact(book.reads)} reads`,
  meta: book.mark,
  icon: GLYPHS[book.glyph],
}));

// --- shared bits -----------------------------------------------------------

function SectionTitle({ icon: Icon, children, action = "View All" }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-black" />
        <h2 className="font-headline-md text-headline-md uppercase tracking-wider text-black">
          {children}
        </h2>
      </div>
      <Link
        to="/discover"
        className="group flex items-center gap-1 font-mono text-label-md font-bold uppercase tracking-wider text-zinc-600 transition-colors hover:text-black"
      >
        <span>{action}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function ShelfButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors hover:bg-black hover:text-white"
    >
      {children}
    </button>
  );
}

// --- featured shelf --------------------------------------------------------

function FeaturedShelf() {
  const shelfRef = useRef(null);

  // step by a real card width so the arrows always advance exactly one card
  const scroll = (direction) => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const first = shelf.firstElementChild;
    const step = first ? first.offsetWidth + 16 : 256;
    shelf.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-black" />
          <h2 className="font-headline-md text-headline-md uppercase tracking-wider text-black">
            Featured Excerpts
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ShelfButton onClick={() => scroll(-1)} label="Previous featured manuscript">
            <ChevronLeft className="h-4 w-4" />
          </ShelfButton>
          <ShelfButton onClick={() => scroll(1)} label="Next featured manuscript">
            <ChevronRight className="h-4 w-4" />
          </ShelfButton>
        </div>
      </div>

      <div
        ref={shelfRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth"
      >
        {featured.map((item) => (
          <Link
            key={item.id}
            to={`/book/${item.id}`}
            className="group flex w-[240px] shrink-0 snap-start cursor-pointer flex-col rounded-xl bg-white p-3 transition-all hover:bg-zinc-100"
          >
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-200">
              {item.cover ? (
                <img
                  src={item.cover}
                  alt={`${item.title} cover`}
                  loading="lazy"
                  className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <item.icon className="h-8 w-8 text-zinc-300 transition-colors group-hover:text-black" />
              )}
              <div
                className={`absolute left-2 top-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-tight ${
                  item.cover ? "bg-black/80 text-white" : "bg-white text-zinc-600"
                }`}
              >
                {item.tag}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-0.5">
              <h3 className="truncate font-body text-sm font-bold text-black group-hover:underline">
                {item.title}
              </h3>
              <p className="font-mono text-label-sm text-zinc-500">{item.author}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// --- genre filter bar ------------------------------------------------------

function GenreBar({ active, onChange, counts }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-label-md uppercase tracking-widest text-zinc-400">
          Browse by genre &amp; focus
        </span>
        <span className="font-mono text-label-sm text-zinc-500">
          {genres.length} filters available
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {genres.map((genre) => {
          const isActive = genre === active;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onChange(genre)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-lg px-4 py-2 font-mono text-label-md uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "bg-white text-zinc-700 hover:bg-black hover:text-white"
              }`}
            >
              {genre}
              {counts[genre] > 0 && (
                <span className={isActive ? "text-zinc-200" : "text-zinc-500"}> · {counts[genre]}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// --- new releases ----------------------------------------------------------

function ReleaseCard({ book }) {
  return (
    <article className="flex flex-col justify-between rounded-xl bg-white p-4 transition-all duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-3">
        <Link to={`/book/${book.id}`} className="group relative block w-full">
          {book.cover ? (
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
              <img
                src={book.cover}
                alt={`${book.title} book cover`}
                loading="lazy"
                className="h-full w-full object-cover grayscale contrast-125 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="relative flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-zinc-100 p-4">
              <book.icon className="h-12 w-12 text-zinc-300 transition-colors group-hover:text-zinc-600" />
            </div>
          )}

          {book.meta && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] text-zinc-400">
              <span>{book.meta}</span>
              {book.meta === "DRAFT #3" ? (
                <Pencil className="h-3 w-3" />
              ) : book.meta === "PART I" ? (
                <LockOpen className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
            </div>
          )}

          {book.cover && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
              <Bookmark className="h-3 w-3" />
            </div>
          )}
        </Link>

        <div className="flex flex-col gap-1">
          <Link to={`/book/${book.id}`}>
            <h3 className="font-body text-base font-bold leading-snug text-black hover:underline">
              {book.title}
            </h3>
          </Link>
          <p className="font-mono text-label-sm text-zinc-500">{book.author}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-[11px] text-zinc-500">
        <span>{book.pages}</span>
        <span className="text-zinc-300">&bull;</span>
        <span>{book.reads}</span>
      </div>
    </article>
  );
}

// --- community spotlight ---------------------------------------------------

function Spotlight() {
  const members = [
    { initials: "JR", tone: "bg-zinc-800" },
    { initials: "NS", tone: "bg-zinc-700" },
    { initials: "RV", tone: "bg-zinc-600" },
    { initials: "+24", tone: "bg-zinc-500" },
  ];

  return (
    <section className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white shadow-sm sm:p-8 lg:flex-row lg:items-center">
      <div className="relative z-10 flex max-w-2xl flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-black">
            Community Spotlight
          </span>
          <span className="font-mono text-[11px] text-zinc-200">&bull; 128 Active Readers Currently</span>
        </div>

        <h3 className="font-headline-lg text-headline-lg font-bold tracking-wide text-white">
          Contemporary South Asian Prose &amp; Verse
        </h3>

        <p className="font-body text-sm leading-relaxed text-zinc-200">
          A weekly participatory circle examining emerging indie manuscripts, micro-essays, and
          Urdu-Hindi verse translations. Discussion prompt rolls every Sunday.
        </p>

        <div className="mt-2 flex items-center gap-4">
          <div className="flex -space-x-2 overflow-hidden">
            {members.map((member) => (
              <span
                key={member.initials}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold text-white ring-2 ring-zinc-900 ${member.tone}`}
              >
                {member.initials}
              </span>
            ))}
          </div>
          <div className="flex w-48 flex-col gap-1">
            <div className="flex justify-between font-mono text-[10px] uppercase text-zinc-200">
              <span>Sprint Progress</span>
              <span>74%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[74%] rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-3 sm:flex-row lg:w-auto">
        <Link
          to="/circles"
          className="w-full rounded-lg bg-white px-6 py-3 font-mono text-label-md font-bold uppercase tracking-wider text-black shadow-sm transition-colors hover:bg-zinc-200 sm:w-auto"
        >
          Join Circle
        </Link>
        <Link
          to="/circles"
          className="w-full rounded-lg bg-zinc-900 px-5 py-3 font-mono text-label-md uppercase tracking-wider text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white sm:w-auto"
        >
          Explore Circle Feed
        </Link>
      </div>

      <Users
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-[240px] w-[240px] select-none text-white opacity-5"
      />
    </section>
  );
}

// --- rising writers --------------------------------------------------------

function RiserCard({ person, following, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 transition-colors hover:bg-zinc-50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-sm font-bold text-zinc-800">
          {person.name.charAt(0)}
        </div>
        <div className="flex min-w-0 flex-col">
          <h4 className="truncate font-body text-sm font-bold text-black">{person.name}</h4>
          <p className="truncate font-mono text-[11px] text-zinc-500">{person.stat}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={following}
        className={`ml-2 shrink-0 rounded-lg px-3.5 py-1.5 font-mono text-label-sm font-bold uppercase tracking-wider transition-all ${
          following
            ? "bg-black text-white"
            : "bg-zinc-100 text-black hover:bg-black hover:text-white"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

// --- page ------------------------------------------------------------------

function DiscoverPage() {
  const [activeGenre, setActiveGenre] = useState("All Genres");
  const [following, setFollowing] = useState(() => new Set());

  const counts = genres.reduce((acc, genre) => {
    acc[genre] =
      genre === "All Genres"
        ? releases.length
        : releases.filter((book) => book.genres.includes(genre)).length;
    return acc;
  }, {});

  const visible = releases.filter(
    (book) => activeGenre === "All Genres" || book.genres.includes(activeGenre)
  );

  const toggleFollow = (id) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col gap-10">
      {/* breadcrumb + telemetry */}
      <div className="flex flex-col items-start justify-between gap-4 pb-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="font-mono text-label-md uppercase tracking-widest text-zinc-400 transition-colors hover:text-black"
          >
            Feed
          </Link>
          <span className="font-mono text-label-sm text-zinc-300">/</span>
          <span className="font-mono text-label-md font-bold uppercase tracking-widest text-black">
            Discover
          </span>
          <span className="ml-3 rounded bg-zinc-200 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
            Curated Catalog
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-label-sm text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>1,842 active drafts</span>
          </div>
          <div className="hidden items-center gap-1.5 sm:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated 4m ago</span>
          </div>
        </div>
      </div>

      <FeaturedShelf />
      <GenreBar active={activeGenre} onChange={setActiveGenre} counts={counts} />

      {/* new releases */}
      <section className="flex flex-col gap-5">
        <SectionTitle icon={Sparkles}>New Releases</SectionTitle>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {visible.map((book) => (
              <ReleaseCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
            <BookOpen className="h-8 w-8 text-zinc-300" />
            <p className="font-headline-md text-headline-md uppercase tracking-wider text-zinc-500">
              Nothing here yet
            </p>
            <p className="max-w-sm font-body text-sm text-zinc-500">
              No manuscripts tagged <span className="font-bold text-black">{activeGenre}</span> so
              far. Try another filter or browse everything.
            </p>
            <button
              type="button"
              onClick={() => setActiveGenre("All Genres")}
              className="mt-1 rounded-lg bg-black px-4 py-2 font-mono text-label-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
            >
              Show All Genres
            </button>
          </div>
        )}
      </section>

      <Spotlight />

      {/* rising writers */}
      <section className="flex flex-col gap-5 pb-8">
        <SectionTitle icon={TrendingUp}>Rising Writers</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {risers.map((person) => (
            <RiserCard
              key={person.id}
              person={person}
              following={following.has(person.id)}
              onToggle={() => toggleFollow(person.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export { DiscoverPage };
