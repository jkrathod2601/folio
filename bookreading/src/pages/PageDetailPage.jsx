import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getPage, compact, annotations } from "@/data/books";
import { GLYPHS } from "@/lib/glyphs";



// --- rail: author -----------------------------------------------------------

function AuthorCard({ book }) {
  const [following, setFollowing] = useState(false);
  const Glyph = GLYPHS[book.glyph] ?? BookOpen;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 grayscale ring-1 ring-zinc-300">
          <AvatarFallback className="font-body text-sm">{book.authorInfo.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-bold text-zinc-950">
            {book.authorInfo.name}
          </p>
          <p className="font-code text-xs text-zinc-500">@{book.authorInfo.username}</p>
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-zinc-500">
        <span className="font-semibold text-zinc-950">
          {compact(book.authorInfo.followers)}
        </span>{" "}
        followers
      </p>

      <Button
        size="sm"
        variant={following ? "secondary" : "default"}
        onClick={() => setFollowing((f) => !f)}
        className="mt-4 w-full"
      >
        {following ? "Following" : "Follow"}
      </Button>

      <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4">
        <Glyph className="h-4 w-4 text-zinc-400" aria-hidden="true" />
        <Link
          to={`/book/${book.id}`}
          className="truncate font-mono text-label-xs uppercase tracking-wider text-zinc-500 hover:text-black"
        >
          {book.title}
        </Link>
      </div>
    </section>
  );
}

// --- rail: table of contents ----------------------------------------------

function BookContents({ book, pages, pageIndex }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        <h3 className="font-heading text-sm text-zinc-950">In this book</h3>
        <span className="ml-auto font-mono text-label-xs text-zinc-400">
          {pages.length} pages
        </span>
      </div>

      <div className="-mx-1 space-y-0.5">
        {pages.map((page, i) => {
          const active = i === pageIndex;
          return (
            <Link
              key={page.id}
              to={`/page/${book.id}/${page.id}`}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 font-body text-sm transition-colors ${
                active
                  ? "bg-black text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              }`}
            >
              <span
                className={`font-mono text-xs ${active ? "text-zinc-200" : "text-zinc-400"}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate">{page.title}</span>
              {page.mood && <span className="text-xs">{page.mood}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// --- rail: annotations ------------------------------------------------------

function Annotations() {
  const [comments, setComments] = useState(annotations);
  const [draft, setDraft] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [
      { id: c.length + 1, author: "Jay Rathod", text, likes: 0, time: "Just now" },
      ...c,
    ]);
    setDraft("");
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        <h3 className="font-heading text-sm text-zinc-950">Annotations</h3>
        <span className="ml-auto font-mono text-label-xs text-zinc-400">{comments.length}</span>
      </div>

      <form onSubmit={submit} className="mb-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Leave a note…"
          aria-label="Leave a note"
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-body text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
        />
        <Button type="submit" size="sm" disabled={!draft.trim()} className="mt-2 w-full">
          <Send className="mr-2 h-3.5 w-3.5" />
          Post Note
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2.5">
            <Avatar className="h-6 w-6 flex-shrink-0 grayscale">
              <AvatarFallback className="font-mono text-[9px]">
                {comment.author.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-body text-xs font-semibold text-zinc-950">
                  {comment.author}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                  {comment.time}
                </span>
              </div>
              <p className="mt-0.5 font-body text-xs leading-relaxed text-zinc-600">
                {comment.text}
              </p>
              <button
                type="button"
                className="mt-1 flex items-center gap-0.5 font-mono text-[10px] text-zinc-400 hover:text-black"
              >
                <Heart className="h-2.5 w-2.5" /> {comment.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- prev / next ------------------------------------------------------------

function PageNav({ page, bookId, direction }) {
  if (!page) return null;
  const isNext = direction === "next";
  const Icon = isNext ? ChevronRight : ChevronLeft;

  return (
    <Link
      to={`/page/${bookId}/${page.id}`}
      className={`group flex flex-1 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-400 ${
        isNext ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-zinc-400 transition-colors group-hover:text-black" />
      <span className="min-w-0">
        <span className="block font-mono text-label-xs uppercase tracking-widest text-zinc-400">
          {isNext ? "Next" : "Previous"}
        </span>
        <span className="block truncate font-body text-sm font-semibold text-zinc-950 group-hover:underline">
          {page.title}
        </span>
      </span>
    </Link>
  );
}

// --- page -------------------------------------------------------------------

function PageDetailPage() {
  // Supports both /page/:id and /page/:bookId/:pageId.
  const { bookId, pageId, id } = useParams();
  const { book, pages, page, pageIndex, prev, next } = getPage(bookId ?? 1, pageId ?? id);

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const claps = (page.likes ?? 0) + (liked ? 1 : 0);
  const paragraphs = page.content.split("\n\n");

  return (
    <div>
      <nav className="mb-5 flex flex-wrap items-center gap-2 font-mono text-label-xs uppercase tracking-wider text-zinc-500">
        <Link to="/library" className="hover:text-black">
          Bookshelf
        </Link>
        <span className="text-zinc-300">/</span>
        <Link to={`/book/${book.id}`} className="hover:text-black">
          {book.title}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-950">{page.title}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 normal-case tracking-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {pageIndex + 1} of {pages.length}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <header className="border-b border-zinc-100 px-8 py-10 text-center">
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-label-xs uppercase tracking-widest text-zinc-500">
                Page {String(pageIndex + 1).padStart(2, "0")}
              </span>
              <h1 className="mt-4 font-heading text-4xl text-zinc-950">{page.title}</h1>
              <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {page.readTime}
                </span>
                <span className="text-zinc-300">&middot;</span>
                <span>{page.date}</span>
              </div>
            </header>

            {page.photo && (
              <figure className="border-b border-zinc-100">
                <img
                  src={page.photo}
                  alt=""
                  className="h-auto max-h-[460px] w-full object-cover grayscale"
                  loading="lazy"
                />
              </figure>
            )}

            <div className="px-8 py-10">
              <div className="mx-auto max-w-[560px] space-y-6">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="font-body text-lg leading-[1.9] text-zinc-900">
                    {i === 0 && (
                      <span className="float-left mr-3 mt-1 font-heading text-5xl leading-[0.8] text-zinc-300">
                        {paragraph.charAt(0)}
                      </span>
                    )}
                    {i === 0 ? paragraph.slice(1) : paragraph}
                  </p>
                ))}
              </div>

              {page.mood && (
                <div className="mt-10 text-center text-2xl" aria-label="Page mood">
                  {page.mood}
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-2 border-t border-zinc-100 pt-6">
                <Button
                  variant={liked ? "default" : "secondary"}
                  size="sm"
                  aria-pressed={liked}
                  aria-label={`Clap for this page, ${claps} claps`}
                  onClick={() => setLiked((l) => !l)}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  {claps}
                </Button>

                <Button
                  variant={bookmarked ? "default" : "secondary"}
                  size="icon"
                  aria-pressed={bookmarked}
                  aria-label="Bookmark page"
                  onClick={() => setBookmarked((b) => !b)}
                  className="h-8 w-8"
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
                </Button>

                <Button asChild variant="secondary" size="sm" className="h-8 gap-1.5 px-2.5">
                  <Link to={`/book/${book.id}/read/${page.id}`}>
                    <BookOpen className="h-4 w-4" />
                    Zen
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Share page" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    <DropdownMenuItem>Share to…</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </article>

          <div className="mt-4 flex items-stretch gap-3">
            <PageNav page={prev} bookId={book.id} direction="prev" />
            <PageNav page={next} bookId={book.id} direction="next" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <AuthorCard book={book} />
          <BookContents book={book} pages={pages} pageIndex={pageIndex} />
          <Annotations />
        </aside>
      </div>
    </div>
  );
}

export { PageDetailPage };
