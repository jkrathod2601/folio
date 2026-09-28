import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Quote,
  Type,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useBook } from "@/hooks/useBooks";
import { usePages } from "@/hooks/usePages";
import { cn } from "@/lib/utils";

/**
 * Zen reading mode — a full-screen, distraction-free reader for one page.
 *
 * The page is found in the book's page list rather than fetched directly: the
 * list endpoint already returns exactly what the current viewer may read
 * (published pages for a reader, the whole manuscript for the author), so a
 * page that isn't in it — a draft, or one in a private book — is refused
 * here too, with no second endpoint to keep the two in sync.
 *
 * Prev/next is computed from that same list, so paging stays inside the
 * set of pages the reader is allowed to see.
 *
 * Reader typography is a preference, not decoration, so it survives navigation.
 */

const PREFS_KEY = "folio:zen";

const TYPE_SCALE = [
  { label: "Compact", size: 15, ratio: 1.55 },
  { label: "Default", size: 17, ratio: 1.75 },
  { label: "Magnified", size: 20, ratio: 1.9 },
];

const LEADING = [
  { label: "Compact", value: 1.5 },
  { label: "Editorial", value: 1.95 },
];

const CANVASES = {
  Void: "bg-zinc-50",
  Slate: "bg-zinc-100",
  Parchment: "bg-zinc-200",
};

const RATES = [0.75, 1, 1.25, 1.5];

const DEVA = /[\u0900-\u097F]/;

const bookmarkKey = (bookId, pageId) => `folio:bookmark:${bookId}:${pageId}`;
const pad = (n) => String(Math.floor(n)).padStart(2, "0");

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function readPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return {
      type: Number.isInteger(stored.type) ? stored.type : 1,
      leading: stored.leading === 1 ? 1 : 0,
      canvas: CANVASES[stored.canvas] ? stored.canvas : "Void",
    };
  } catch {
    return { type: 1, leading: 0, canvas: "Void" };
  }
}

function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" aria-label="Loading page" />
      <p className="font-code text-xs text-zinc-500">Loading page…</p>
    </div>
  );
}

function Refusal({ heading, body }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 p-8 text-center">
      <h1 className="font-heading text-2xl uppercase tracking-wide text-zinc-950">{heading}</h1>
      <p className="max-w-md font-body text-sm text-zinc-600">{body}</p>
      <Link
        to="/library"
        className="mt-2 rounded-lg bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
      >
        Back to the library
      </Link>
    </div>
  );
}

function ZenReaderPage() {
  const { bookId, pageId } = useParams();
  const bookQuery = useBook(bookId);
  const pagesQuery = usePages(bookId);

  const [prefs, setPrefs] = useState(readPrefs);
  const [panel, setPanel] = useState(false);
  const [progress, setProgress] = useState(0);
  // Narration state is tagged with the folio it belongs to, so paging forward
  // resets it during render rather than in an effect that fires a frame late.
  const [audio, setAudio] = useState({ folio: null, playing: false, elapsed: 0 });
  const [rate, setRate] = useState(1);
  const [muted, setMuted] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      return localStorage.getItem(bookmarkKey(bookId, pageId)) === "1";
    } catch {
      return false;
    }
  });
  const articleRef = useRef(null);

  // Reader progress is measured against the document, not the article, so the
  // header and the bottom of the page agree.
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / total) * 100))) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pageId, bookId]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* private mode: prefs simply do not persist */
    }
  }, [prefs]);

  const folio = `${bookId}:${pageId}`;
  const live = audio.folio === folio ? audio : { folio, playing: false, elapsed: 0 };
  const { playing, elapsed } = live;
  const setAudioForFolio = (patch) =>
    setAudio((a) => ({ folio, playing: false, elapsed: 0, ...(a.folio === folio ? a : {}), ...patch }));

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(
      () => setAudio((a) => (a.folio === folio ? { ...a, elapsed: a.elapsed + 0.25 * rate } : a)),
      250
    );
    return () => clearInterval(id);
  }, [playing, rate, folio]);

  const toggleBookmark = useCallback(() => {
    setSaved((was) => {
      const next = !was;
      try {
        if (next) localStorage.setItem(bookmarkKey(bookId, pageId), "1");
        else localStorage.removeItem(bookmarkKey(bookId, pageId));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [bookId, pageId]);

  // Keyboard: the reader should be operable without reaching for the mouse.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === "Escape") setPanel(false);
      if (e.key === "b") toggleBookmark();
      if (e.key === " ") {
        e.preventDefault();
        setAudio((a) => ({ folio, playing: !(a.folio === folio && a.playing), elapsed: 0 }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleBookmark, folio]);

  const type = TYPE_SCALE[prefs.type];
  const leading = LEADING[prefs.leading].value;

  if (bookQuery.isLoading || pagesQuery.isLoading) return <Loading />;

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
  const pages = pagesQuery.data ?? [];
  const pageIndex = pages.findIndex((p) => p.id === pageId);
  const page = pageIndex >= 0 ? pages[pageIndex] : null;

  // Not in the list means not published (or not the author's book) — the
  // reader has no business opening it.
  if (!page) {
    return (
      <Refusal
        heading="This page isn't available"
        body="It may be a draft, or it may belong to a book you can't read."
      />
    );
  }

  const prev = pageIndex > 0 ? pages[pageIndex - 1] : null;
  const next = pageIndex < pages.length - 1 ? pages[pageIndex + 1] : null;
  const chapter = String(pageIndex + 1).padStart(2, "0");
  const isDevanagari = DEVA.test(page.body ?? "");
  const pageDate = formatDate(page.updatedAt);

  return (
    <div className={`min-h-screen ${CANVASES[prefs.canvas]}`}>
      {/* Reading bar: return, position, and the two controls worth surfacing. */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to={`/book/${book.id}`}
            className="flex min-w-0 items-center gap-2 rounded px-2 py-1 font-code text-xs text-zinc-600 transition-colors hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden truncate uppercase tracking-widest sm:inline">{book.title}</span>
            <span className="truncate uppercase tracking-widest sm:hidden">Folio</span>
          </Link>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full bg-zinc-950 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-9 font-mono text-xs tabular-nums text-zinc-600">{progress}%</span>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              className="flex items-center gap-1.5 rounded px-2 py-1.5 font-code text-xs uppercase tracking-wider text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            >
              <Type className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Text</span>
            </button>
            <button
              type="button"
              onClick={toggleBookmark}
              aria-pressed={saved}
              aria-label={saved ? "Remove bookmark" : "Bookmark this page"}
              className={`rounded p-2 transition-colors ${
                saved ? "text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              {saved ? (
                <BookmarkCheck className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Bookmark className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </button>

            {panel && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-code text-xs uppercase tracking-widest text-zinc-500">
                    Typography
                  </span>
                  <button
                    type="button"
                    onClick={() => setPanel(false)}
                    aria-label="Close typography settings"
                    className="rounded p-1 text-zinc-500 hover:text-zinc-950"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <fieldset className="mb-4">
                  <legend className="mb-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-500">
                    Type size
                  </legend>
                  <div className="flex items-center justify-between gap-1 rounded-lg bg-zinc-50 p-1">
                    <button
                      type="button"
                      onClick={() => setPrefs((p) => ({ ...p, type: Math.max(0, p.type - 1) }))}
                      disabled={prefs.type === 0}
                      className="rounded px-2.5 py-1 font-code text-xs text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                    >
                      A-
                    </button>
                    <span className="font-mono text-xs text-zinc-950">{type.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({ ...p, type: Math.min(TYPE_SCALE.length - 1, p.type + 1) }))
                      }
                      disabled={prefs.type === TYPE_SCALE.length - 1}
                      className="rounded px-2.5 py-1 font-code text-xs text-zinc-600 hover:bg-zinc-200 disabled:opacity-40"
                    >
                      A+
                    </button>
                  </div>
                </fieldset>

                <fieldset className="mb-4">
                  <legend className="mb-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-500">
                    Leading
                  </legend>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LEADING.map((option, i) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, leading: i }))}
                        aria-pressed={prefs.leading === i}
                        className={`rounded-lg px-2 py-1.5 font-code text-xs capitalize transition-colors ${
                          prefs.leading === i
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-500">
                    Focus canvas
                  </legend>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-50 p-1 text-center">
                    {Object.keys(CANVASES).map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setPrefs((p) => ({ ...p, canvas: name }))}
                        aria-pressed={prefs.canvas === name}
                        className={`rounded px-1 py-1.5 font-code text-xs transition-colors ${
                          prefs.canvas === name
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-600 hover:text-zinc-950"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pb-40 pt-10 sm:px-6">
        <article ref={articleRef}>
          {/* Chapter masthead */}
          <section className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6">
            <div className="flex items-center gap-2 font-code text-xs uppercase tracking-widest text-zinc-500">
              <span>{book.mark || "Volume 01"}</span>
              <span aria-hidden="true">/</span>
              <span>Folio {chapter}</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-950" />
            </div>

            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-wide text-zinc-950 sm:text-4xl">
              {chapter}. {page.title} {page.mood && <span aria-hidden="true">{page.mood}</span>}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-code text-xs text-zinc-600">
              <span className="font-semibold text-zinc-950">{book.author?.name ?? "Unknown"}</span>
              <span className="text-zinc-500" aria-hidden="true">
                /
              </span>
              <span>{page.readMinutes} min read</span>
              <span className="text-zinc-500" aria-hidden="true">
                /
              </span>
              <span>{pageDate ?? "—"}</span>
              <span
                className={cn(
                  "rounded px-2 py-0.5 uppercase tracking-wider",
                  page.status === "published"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-200 text-zinc-700",
                )}
              >
                {page.status}
              </span>
            </div>
          </section>

          {/* Manuscript plate */}
          <section className="flex flex-col gap-8">
            {isDevanagari ? (
              /* The page is a single Devanagari passage, so it becomes the
                 set-piece block rather than a plain paragraph. */
              <div className="relative rounded-xl bg-zinc-100 p-6 sm:p-8">
                <span className="absolute -top-3 left-6 rounded bg-zinc-950 px-2 font-code text-[11px] uppercase tracking-widest text-white">
                  Shuruaat
                </span>
                <p
                  className="font-body font-light leading-relaxed text-zinc-950"
                  style={{ fontSize: type.size + 1, lineHeight: leading }}
                >
                  {page.body}
                </p>
                <div className="mt-5 flex items-center justify-between font-code text-[11px] text-zinc-600">
                  <span>Folio {chapter}</span>
                  <Quote className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
            ) : (
              <p
                className="font-body text-zinc-800"
                style={{ fontSize: type.size, lineHeight: leading }}
              >
                {page.body}
              </p>
            )}
          </section>

          {/* Sign-off */}
          <div className="my-10 flex flex-col items-center gap-1.5 py-6 text-center">
            <span className="font-heading text-xl text-zinc-950" aria-hidden="true">
              ❦
            </span>
            <span className="font-code text-xs uppercase tracking-widest text-zinc-600">
              End of folio {chapter}
            </span>
            <span className="font-code text-[11px] text-zinc-500">
              From the collection: {book.title}
            </span>
          </div>

          {/* Chapter paging */}
          <nav
            aria-label="Folio paging"
            className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6 sm:flex-row sm:items-stretch"
          >
            {prev ? (
              <Link
                to={`/book/${book.id}/read/${prev.id}`}
                className="flex flex-1 flex-col items-start rounded-lg bg-zinc-100 p-4 transition-colors hover:bg-zinc-200"
              >
                <span className="font-code text-[11px] uppercase tracking-widest text-zinc-500">
                  Previous
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-sm text-zinc-900">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {String(pageIndex).padStart(2, "0")}. {prev.title}
                </span>
              </Link>
            ) : (
              <div className="flex flex-1 flex-col items-start rounded-lg bg-zinc-100 p-4 opacity-40">
                <span className="font-code text-[11px] uppercase tracking-widest text-zinc-500">
                  Previous
                </span>
                <span className="mt-1 font-mono text-sm text-zinc-500">This is the first folio</span>
              </div>
            )}

            {next ? (
              <Link
                to={`/book/${book.id}/read/${next.id}`}
                className="group flex flex-1 flex-col items-end rounded-lg bg-zinc-950 p-4 text-right transition-colors hover:bg-zinc-800"
              >
                <span className="font-code text-[11px] uppercase tracking-widest text-zinc-200">
                  Next folio
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-sm font-bold text-white">
                  {String(pageIndex + 2).padStart(2, "0")}. {next.title}
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ) : (
              <div className="flex flex-1 flex-col items-end rounded-lg bg-zinc-950 p-4 text-right">
                <span className="font-code text-[11px] uppercase tracking-widest text-zinc-200">
                  Next folio
                </span>
                <span className="mt-1 font-mono text-sm text-zinc-200">You have reached the end</span>
              </div>
            )}
          </nav>
        </article>
      </main>

      {/* Narration dock */}
      <aside
        aria-label="Narration controls"
        className="fixed bottom-5 left-1/2 z-40 flex w-11/12 max-w-lg -translate-x-1/2 items-center gap-3 rounded-full border border-zinc-200 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-lg"
      >
        <button
          type="button"
          onClick={() => setAudioForFolio({ playing: !playing })}
          aria-pressed={playing}
          aria-label={playing ? "Pause narration" : "Play narration"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition-transform active:scale-95"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 font-code text-[11px] text-zinc-950">
            <span className="truncate font-semibold">Narration by {book.author?.name ?? "author"}</span>
            <span className="shrink-0 tabular-nums text-zinc-600">
              {pad(elapsed / 60)}:{pad(elapsed % 60)}
            </span>
          </div>
          <div className="mt-1 flex h-4 items-end gap-1" aria-hidden="true">
            {[8, 12, 16, 8, 12, 4, 16, 8, 12, 16, 4, 12].map((h, i) => (
              <span
                key={i}
                style={{ height: h }}
                className={`w-0.5 rounded-full ${
                  playing ? "animate-pulse bg-zinc-950" : "bg-zinc-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length])}
            aria-label="Change narration speed"
            className="rounded bg-zinc-100 px-1.5 py-0.5 font-code text-[11px] text-zinc-700 hover:bg-zinc-200"
          >
            {rate.toFixed(2).replace(/0$/, "").replace(/(\.\d)0$/, "$1")}x
          </button>
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            aria-pressed={muted}
            aria-label={muted ? "Unmute narration" : "Mute narration"}
            className="rounded p-1.5 text-zinc-600 transition-colors hover:text-zinc-950"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}

export { ZenReaderPage };
