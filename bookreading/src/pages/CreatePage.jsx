import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlignCenter,
  ArrowLeft,
  ArrowRight,
  Bold,
  Check,
  Feather,
  FileText,
  GripVertical,
  Italic,
  Loader2,
  Plus,
  Quote,
  Trash2,
  Type,
} from "lucide-react";
import { useBook, useMyBooks } from "@/hooks/useBooks";
import {
  usePages,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
} from "@/hooks/usePages";
import { BookCover } from "@/components/BookCover";
import { cn } from "@/lib/utils";

/**
 * The writing studio.
 *
 * A book is an ordered stack of pages, so this screen edits one page at a time
 * and keeps the stack in the left rail: pick a page, write, autosave, publish.
 * The page being edited lives in local state; the server is the source of
 * truth for everything else, and the debounced autosave is the only writer
 * while typing — an explicit Save or Publish for everything else.
 *
 * The book comes from `?book=<id>`, which the new-book form navigates to on
 * create. Without it the screen is a picker over the author's shelf.
 */

const WORD_TARGET = 5000;
const WORDS_PER_MINUTE = 200;
const AUTOSAVE_DELAY = 800;

/** The moods the product spec shows on a page. Free text is stored; these are
 *  the suggestions. A closed list would push an author to the nearest wrong
 *  feeling. */
const MOODS = ["😊", "😔", "❤️", "😎", "🌧️", "✨", "🌙", "🕊️"];

const countWords = (text) => (text ?? "").trim().split(/\s+/).filter(Boolean).length;
const clockLabel = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// --- toolbar ---------------------------------------------------------------

function ToolButton({ onClick, title, children, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors",
        active ? "bg-zinc-100 text-black" : "text-zinc-700 hover:bg-zinc-100 hover:text-black",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ onWrap, verseMode, onVerseMode, readMins, words, lines }) {
  return (
    <div className="sticky top-16 z-10 flex w-full flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-1.5">
        <ToolButton onClick={() => onWrap("## ")} title="Heading">
          <Type className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => onWrap("**")} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => onWrap("_")} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton onClick={() => onWrap("> ")} title="Pull quote">
          <Quote className="h-4 w-4" />
        </ToolButton>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <button
          type="button"
          onClick={onVerseMode}
          aria-pressed={verseMode}
          className="flex items-center gap-1.5 rounded bg-black px-3 py-1 font-mono text-[11px] font-medium tracking-wider text-white shadow-sm"
        >
          <AlignCenter className="h-3.5 w-3.5" />
          Verse Mode: {verseMode ? "ON" : "OFF"}
        </button>
      </div>

      <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5 text-zinc-400" />
          {readMins} min read
        </span>
        <span className="text-zinc-300">&bull;</span>
        <span>{words} words</span>
        <span className="text-zinc-300">&bull;</span>
        <span>{lines} lines</span>
      </div>
    </div>
  );
}

// --- book picker -----------------------------------------------------------

/** Shown when the screen is opened without `?book=` — pick a manuscript. */
function BookPicker({ books, isLoading }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl uppercase tracking-wide text-zinc-950">
        Write
      </h1>
      <p className="mt-2 font-body text-sm text-zinc-600">
        Pick a manuscript to write in, or bind a new one.
      </p>
      {isLoading ? (
        <Loader2 className="mt-6 h-5 w-5 animate-spin text-zinc-400" aria-label="Loading books" />
      ) : books.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <p className="font-body text-sm text-zinc-600">
            You have no books yet. Bind one, then start writing.
          </p>
          <Link
            to="/books/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
          >
            <Feather className="h-3.5 w-3.5" />
            Bind a new book
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                to={`/write?book=${book.id}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-500"
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm uppercase tracking-wide text-zinc-950">
                    {book.title}
                  </p>
                  <p className="font-code text-[11px] text-zinc-500">
                    {book.pageCount} {book.pageCount === 1 ? "page" : "pages"} · {book.status}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-950" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/profile"
        className="mt-6 inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to your profile
      </Link>
    </div>
  );
}

// --- the studio ------------------------------------------------------------

function Studio({ bookId }) {
  const bookQuery = useBook(bookId);
  const pagesQuery = usePages(bookId);
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [verseMode, setVerseMode] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const bodyRef = useRef(null);
  const titleRef = useRef(null);

  // The draft the debounced autosave will write. Held in a ref, not state,
  // because the timer fires after the user may have moved on — it must write
  // the page it was scheduled for, not whichever page is current by then.
  const draftRef = useRef({ pageId: null, title: "", body: "", mood: "" });
  const timerRef = useRef(null);

  const words = useMemo(() => countWords(body), [body]);
  const lines = useMemo(() => body.split("\n").filter((l) => l.trim()).length, [body]);
  const readMins = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const totalWords = useMemo(
    () => (pagesQuery.data ?? []).reduce((sum, p) => sum + countWords(p.body), 0),
    [pagesQuery.data],
  );
  const goalPct = Math.min(100, Math.round((totalWords / WORD_TARGET) * 100));
  const pages = pagesQuery.data ?? [];

  // Fire the pending autosave immediately — used when switching pages, adding
  // one, or deleting the one being edited, so no keystroke is written to the
  // wrong page or lost under the navigation.
  const flushSave = () => {
    clearTimeout(timerRef.current);
    const draft = draftRef.current;
    draftRef.current = { pageId: null, title: "", body: "", mood: "" };
    if (!draft.pageId) return;
    setSaving(true);
    updatePage.mutate(
      { bookId, pageId: draft.pageId, title: draft.title, body: draft.body, mood: draft.mood },
      {
        onSettled: () => setSaving(false),
        onError: (err) => setSaveError(err.message),
        onSuccess: () => {
          setSavedAt(new Date());
          setSaveError(null);
        },
      },
    );
  };

  const scheduleSave = () => {
    if (!currentId) return;
    setSaving(true);
    draftRef.current = { pageId: currentId, title, body, mood };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flushSave, AUTOSAVE_DELAY);
  };

  // Load the first page once the list arrives, so an existing book opens with
  // something on the canvas rather than an empty editor. Guarded on the book id
  // so a background refetch cannot discard whatever the author just picked.
  useEffect(() => {
    if (!pagesQuery.data || currentId) return;
    const first = pagesQuery.data[0];
    if (!first) return;
    setCurrentId(first.id);
    setTitle(first.title);
    setBody(first.body);
    setMood(first.mood ?? "");
    setSavedAt(new Date(first.updatedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesQuery.data]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const selectPage = (page) => {
    if (page.id === currentId) return;
    flushSave();
    setCurrentId(page.id);
    setTitle(page.title);
    setBody(page.body);
    setMood(page.mood ?? "");
    setSavedAt(new Date(page.updatedAt));
    setSaveError(null);
  };

  const addPage = () => {
    flushSave();
    createPage.mutate(
      { bookId, title: "Untitled Page", body: "", mood: "" },
      {
        onSuccess: ({ page }) => {
          setCurrentId(page.id);
          setTitle(page.title);
          setBody(page.body);
          setMood(page.mood ?? "");
          setSavedAt(new Date());
          setSaveError(null);
          requestAnimationFrame(() => titleRef.current?.focus());
        },
        onError: (err) => setSaveError(err.message),
      },
    );
  };

  const removePage = (page) => {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    const wasCurrent = page.id === currentId;
    if (wasCurrent) {
      clearTimeout(timerRef.current);
      draftRef.current = { pageId: null, title: "", body: "", mood: "" };
      setCurrentId(null);
      setTitle("");
      setBody("");
      setMood("");
      setSavedAt(null);
    }
    deletePage.mutate(
      { bookId, pageId: page.id },
      {
        onSuccess: () => {
          if (!wasCurrent) return;
          const remaining = pages.filter((p) => p.id !== page.id);
          if (remaining.length) {
            const next = remaining[Math.min(page.ordinal - 1, remaining.length - 1)];
            setCurrentId(next.id);
            setTitle(next.title);
            setBody(next.body);
            setMood(next.mood ?? "");
            setSavedAt(new Date(next.updatedAt));
          }
        },
        onError: (err) => setSaveError(err.message),
      },
    );
  };

  /** Save with an explicit status — the two buttons in the footer. */
  const saveWithStatus = (status) => {
    if (!currentId) return;
    clearTimeout(timerRef.current);
    draftRef.current = { pageId: null, title: "", body: "", mood: "" };
    setSaving(true);
    updatePage.mutate(
      { bookId, pageId: currentId, title, body, mood, status },
      {
        onSettled: () => setSaving(false),
        onSuccess: () => {
          setSavedAt(new Date());
          setSaveError(null);
        },
        onError: (err) => setSaveError(err.message),
      },
    );
  };

  const wrapSelection = (token) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || "text";
    setBody(`${value.slice(0, start)}${token}${selected}${token}${value.slice(end)}`);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length + selected.length);
    });
  };

  if (bookQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 font-code text-xs text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading book
      </p>
    );
  }

  // 403/404 land here too, and the server's message is the useful one.
  if (bookQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl uppercase tracking-wide text-zinc-950">
          Cannot edit this book
        </h1>
        <p className="mt-2 font-body text-sm text-zinc-600">{bookQuery.error.message}</p>
        <Link
          to="/profile"
          className="mt-5 inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to your profile
        </Link>
      </div>
    );
  }

  const book = bookQuery.data;
  const current = pages.find((p) => p.id === currentId) ?? null;

  return (
    <div className="flex w-full flex-col">
      {/* studio action ribbon */}
      <div className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-8 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zinc-500">
            <Link to="/profile" className="transition-colors hover:text-black">
              Bookshelf
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-700">{book.title}</span>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold text-black">
              {current ? `Page ${String(current.ordinal).padStart(2, "0")}` : "Write"}
            </span>
          </div>
          <div className="mx-2 hidden h-4 w-px bg-zinc-200 sm:block" />
          <div className="flex items-center gap-2 rounded bg-zinc-100 px-2.5 py-1 font-mono text-[11px] text-zinc-700">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : savedAt ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Saved {clockLabel(savedAt)}</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Idle</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveWithStatus("draft")}
            disabled={saving || !currentId}
            className="rounded border border-zinc-200 bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-700 transition-all hover:bg-zinc-50 hover:text-black disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => saveWithStatus(current?.status === "published" ? "draft" : "published")}
            disabled={saving || !currentId}
            className="flex items-center gap-2 rounded bg-black px-5 py-2 font-mono text-xs font-medium uppercase tracking-wider text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
          >
            {current?.status === "published" ? "Unpublish" : "Publish page"}
            <span className="text-[10px] opacity-70">&crarr;</span>
          </button>
        </div>
      </div>

      {saveError && (
        <p
          role="alert"
          className="border-b border-zinc-200 bg-zinc-50 px-8 py-2 font-code text-[11px] text-zinc-800"
        >
          {saveError}
        </p>
      )}

      {/* workspace */}
      <div className="mx-auto w-full max-w-[1600px] p-6 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* left: cover + toc + goal */}
          <aside className="flex flex-col gap-6 lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <BookCover book={book} className="w-full border border-zinc-200 shadow-sm" />

              <dl className="mt-4 space-y-1.5 font-code text-[11px] text-zinc-600">
                <div className="flex justify-between gap-3">
                  <dt>Title</dt>
                  <dd className="truncate text-zinc-950">{book.title}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Status</dt>
                  <dd className="text-zinc-950">{book.status}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Pages</dt>
                  <dd className="text-zinc-950">{book.pageCount}</dd>
                </div>
              </dl>

              {/* table of contents */}
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900">
                      Table of Contents
                    </span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                      {pages.length} {pages.length === 1 ? "page" : "pages"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {pages.length === 0 && (
                    <p className="rounded-lg border border-dashed border-zinc-300 px-3.5 py-4 font-body text-xs leading-relaxed text-zinc-500">
                      No pages yet. Write the first one — a title is enough to start.
                    </p>
                  )}
                  {pages.map((page) => {
                    const isCurrent = page.id === currentId;
                    const isDraft = page.status === "draft";
                    return (
                      <div
                        key={page.id}
                        className={cn(
                          "group flex cursor-pointer items-center justify-between rounded-lg p-2.5 transition-all",
                          isCurrent
                            ? "bg-black text-white shadow-sm"
                            : "border border-zinc-100 bg-zinc-50 hover:border-zinc-300",
                        )}
                        onClick={() => selectPage(page)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectPage(page);
                          }
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <GripVertical
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isCurrent ? "text-zinc-500" : "text-zinc-300",
                            )}
                          />
                          {isDraft && (
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 animate-ping rounded-full",
                                isCurrent ? "bg-white" : "bg-emerald-500",
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "font-mono text-xs font-semibold",
                              isCurrent ? "text-white" : "text-zinc-400",
                            )}
                          >
                            {String(page.ordinal).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "truncate text-sm",
                              isCurrent ? "font-semibold text-white" : "font-medium text-zinc-800",
                            )}
                          >
                            {page.title || "Untitled Page"}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              "font-mono text-[10px]",
                              isCurrent ? "text-zinc-400" : "text-zinc-400",
                            )}
                          >
                            {countWords(page.body)}w
                          </span>
                          {isDraft ? (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                                isCurrent ? "bg-white text-black" : "bg-zinc-200 text-zinc-600",
                              )}
                            >
                              Draft
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase",
                                isCurrent ? "bg-white text-black" : "bg-zinc-200 text-zinc-700",
                              )}
                            >
                              Live
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePage(page);
                            }}
                            aria-label={`Delete ${page.title}`}
                            className="text-zinc-300 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addPage}
                  disabled={createPage.isPending}
                  className="group mt-2 flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-zinc-900 transition-all hover:bg-zinc-200 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                      Add page
                    </span>
                  </span>
                  {createPage.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </button>
              </div>

              {/* goal */}
              <div className="mt-6 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Manuscript goal
                  </span>
                  <span className="font-mono text-xs font-bold text-black">{goalPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-black transition-all duration-500"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <span>{totalWords.toLocaleString()} words written</span>
                  <span>{WORD_TARGET.toLocaleString()} target</span>
                </div>
              </div>
            </div>
          </aside>

          {/* right: editor */}
          <div className="flex min-h-[880px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-8">
            {current ? (
              <>
                <Toolbar
                  onWrap={wrapSelection}
                  verseMode={verseMode}
                  onVerseMode={() => setVerseMode((v) => !v)}
                  readMins={readMins}
                  words={words}
                  lines={lines}
                />

                {/* page header */}
                <div className="flex flex-col gap-3 px-8 pb-4 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-800">
                      PAGE {String(current.ordinal).padStart(2, "0")} / {pages.length}
                    </span>
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        current.status === "published" ? "bg-emerald-500" : "bg-zinc-400",
                      )}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                      {current.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      scheduleSave();
                    }}
                    placeholder="Page title…"
                    aria-label="Page title"
                    className="w-full border-b border-transparent bg-transparent py-1 font-heading text-3xl tracking-tight text-black transition-colors placeholder:text-zinc-300 focus:border-zinc-200 focus:outline-none md:text-4xl"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                      Mood
                    </span>
                    {MOODS.map((m) => {
                      const on = mood === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            setMood(on ? "" : m);
                            scheduleSave();
                          }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-colors",
                            on
                              ? "border-zinc-950 bg-zinc-950"
                              : "border-zinc-200 hover:border-zinc-500",
                          )}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mx-8 my-2 h-px bg-zinc-100" />

                {/* canvas */}
                <div
                  className={cn(
                    "flex flex-1 select-text flex-col gap-6 px-8 py-6 leading-relaxed text-zinc-800",
                    verseMode ? "text-center" : "text-left",
                  )}
                >
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      scheduleSave();
                    }}
                    rows={14}
                    spellCheck="false"
                    placeholder="Start writing…"
                    aria-label="Page body"
                    className={cn(
                      "w-full resize-none bg-transparent font-body text-base leading-loose text-zinc-800 focus:outline-none md:text-lg",
                    )}
                  />

                  <div className="flex items-center gap-2 pt-2 font-mono text-xs text-zinc-400">
                    <span className="inline-block h-4 w-2 animate-pulse bg-black" />
                    <span className="select-none">Autosaves as you write</span>
                  </div>
                </div>

                {/* footer */}
                <footer className="mt-auto flex w-full flex-col gap-5 border-t border-zinc-200 bg-zinc-50 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => removePage(current)}
                      className="rounded px-3 py-2 font-mono text-xs uppercase tracking-wider text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
                      Delete page
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="font-code text-[11px] text-zinc-500">
                        {savedAt
                          ? `Last saved ${clockLabel(savedAt)}`
                          : "Not saved yet"}
                      </span>
                      <button
                        type="button"
                        onClick={() => saveWithStatus("draft")}
                        disabled={saving}
                        className="rounded border border-zinc-300 bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-zinc-800 transition-all hover:bg-zinc-100"
                      >
                        Save draft
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          saveWithStatus(
                            current.status === "published" ? "draft" : "published",
                          )
                        }
                        disabled={saving}
                        className="flex items-center gap-2 rounded bg-black px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-zinc-800"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        {current.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
                  <Feather className="h-5 w-5 text-zinc-400" />
                </div>
                <h2 className="font-heading text-xl uppercase tracking-wide text-zinc-950">
                  {pages.length ? "Pick a page to edit" : "Write your first page"}
                </h2>
                <p className="max-w-sm font-body text-sm leading-relaxed text-zinc-600">
                  {pages.length
                    ? "Choose a page from the table of contents, or add a new one."
                    : "A page is one piece of the book — a chapter, a scene, a single thought. Start with a title."}
                </p>
                <button
                  type="button"
                  onClick={addPage}
                  disabled={createPage.isPending}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {createPage.isPending ? "Adding…" : "Add the first page"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreatePage() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("book");
  const myBooks = useMyBooks();

  if (!bookId) return <BookPicker books={myBooks.data ?? []} isLoading={myBooks.isLoading} />;
  return <Studio key={bookId} bookId={bookId} />;
}
