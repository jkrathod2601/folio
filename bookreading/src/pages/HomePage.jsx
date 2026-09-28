import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, ChevronDown, Globe, Quote, ImagePlus, EyeOff, MoreHorizontal, BadgeCheck,
  Heart, MessageCircle, Bookmark, Share2, ArrowUpRight, Play, Headphones, MessagesSquare,
  Highlighter, BookmarkPlus, Timer, SquarePen, Flame, Users, Star, UserPlus, Plus, X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const streams = [
  { label: "For You (Curated)", dot: true },
  { label: "Following Authors" },
  { label: "Latest Chapters", badge: "NEW" },
  { label: "Writing Prompts" },
  { label: "Poetry & Micro-fiction" },
];

const waveform = [
  ["h-3", "bg-black"], ["h-5", "bg-black"], ["h-4", "bg-black"], ["h-6", "bg-black"],
  ["h-3", "bg-black"], ["h-5", "bg-zinc-800"], ["h-2", "bg-zinc-800"], ["h-4", "bg-zinc-600"],
  ["h-3", "bg-zinc-300"], ["h-5", "bg-zinc-300"], ["h-2", "bg-zinc-300"], ["h-4", "bg-zinc-300"],
  ["h-3", "bg-zinc-300"], ["h-5", "bg-zinc-300"], ["h-2", "bg-zinc-300"], ["h-4", "bg-zinc-300"],
  ["h-6", "bg-zinc-300"], ["h-3", "bg-zinc-300"], ["h-2", "bg-zinc-300"], ["h-4", "bg-zinc-300"],
  ["h-5", "bg-zinc-300"], ["h-3", "bg-zinc-300"], ["h-2", "bg-zinc-300"],
];

const draftTools = [
  { icon: Quote, label: "Add Pull Quote" },
  { icon: ImagePlus, label: "Attach Cover Image" },
  { icon: EyeOff, label: "Spoiler Tag" },
];

const formats = ["Prose", "Poetry", "Dialogue"];

const promptContributors = [
  { initials: "AK", className: "bg-zinc-200 text-zinc-950" },
  { initials: "MR", className: "bg-zinc-300 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" },
  { initials: "SZ", className: "bg-zinc-800 text-white" },
];

const sprint = { streak: 4, goal: 1000, done: 650 };

const trendingBooks = [
  { id: 1, title: "The Quiet Canvas", meta: "Elena Vance • Fiction • 14k reads" },
  { id: 2, title: "Echoes of Solitude", meta: "Marcus Rowe • Memoir • 8.2k reads" },
  { id: 3, title: "Zindagi Ke Panne", meta: "Aarav Sharma • Poetry • 19k reads" },
];

const mentors = [
  { id: 1, name: "Julian Lyre", meta: "Essayist & Poet • 3 Books", initials: "JL" },
  { id: 2, name: "Sara Chen", meta: "Fiction & Worldbuilding", initials: "SC" },
];

/* ── Feed tab navigation ─────────────────────────────────────── */
function StreamTabs() {
  const [active, setActive] = useState(streams[0].label);

  return (
    <section aria-label="Feed Filters" className="rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-0.5">
        {streams.map((stream) => {
          const isActive = active === stream.label;
          return (
            <button
              key={stream.label}
              onClick={() => setActive(stream.label)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-1.5 font-body text-xs transition-all",
                isActive
                  ? "bg-black font-semibold text-white shadow-sm"
                  : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-black"
              )}
            >
              {stream.dot && <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />}
              <span>{stream.label}</span>
              {stream.badge && (
                <span className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-code text-[10px] text-black">
                  {stream.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ── Draft composer ──────────────────────────────────────────── */
function Composer() {
  const [value, setValue] = useState("");
  const [format, setFormat] = useState(formats[0]);
  const [open, setOpen] = useState(false);

  // Collapsed by default so it does not push the feed down the page.
  if (!open) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors hover:border-zinc-400">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 grayscale ring-1 ring-zinc-300">
            <AvatarFallback className="font-body text-xs">J</AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left font-mono text-xs uppercase tracking-wider text-zinc-500 transition-colors hover:border-zinc-400 hover:text-black"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11 shrink-0 grayscale ring-1 ring-zinc-300">
          <AvatarFallback className="font-body text-sm">J</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between pb-1.5">
            <span className="font-heading text-xl font-medium tracking-wide text-black">
              What are you drafting today, Jay?
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close composer"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-2">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              placeholder="Share a chapter excerpt, raw verse, or plot question..."
              className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 font-body text-sm leading-relaxed text-black transition-all placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-mono text-xs text-black transition-colors hover:border-black">
                <BookOpen className="h-3.5 w-3.5 text-black" />
                <span className="max-w-[130px] truncate font-medium">Zindagi Ke Kuch Panne</span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>

              <button className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-600 transition-colors hover:text-black">
                <Globe className="h-3 w-3" />
                <span>Public Excerpt</span>
              </button>

              <div className="flex items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-100 p-0.5">
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-body text-xs transition-colors",
                      f === format
                        ? "bg-black font-semibold text-white shadow-xs"
                        : "text-zinc-600 hover:text-black"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-zinc-500">
                {draftTools.map((tool) => (
                  <button
                    key={tool.label}
                    title={tool.label}
                    className="rounded-lg p-1.5 transition-colors hover:bg-zinc-100 hover:text-black"
                  >
                    <tool.icon className="h-[18px] w-[18px]" />
                  </button>
                ))}
              </div>
              <Button asChild>
                <Link to="/write">
                  <span>Publish Excerpt</span>
                  <kbd className="hidden rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px] font-normal text-zinc-200 md:inline-block">
                    ⌘↵
                  </kbd>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Post 1: featured manuscript excerpt ─────────────────────── */
function ExcerptPost() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [claps, setClaps] = useState(82);

  const clap = () => {
    setLiked((v) => !v);
    setClaps((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <article className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:border-zinc-400">
      <div className="absolute left-0 right-0 top-0 h-1 bg-black" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 grayscale ring-1 ring-zinc-300">
            <AvatarFallback className="font-body text-sm">J</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-body text-sm font-bold tracking-tight text-black">Jay Rathod</span>
              <BadgeCheck className="h-[18px] w-[18px] text-black" />
              <span className="font-code text-xs text-zinc-500">@jay</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="font-body text-xs font-medium text-black">Author of &lsquo;Zindagi Ke Kuch Panne&rsquo;</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="font-mono text-xs text-zinc-500">2h ago</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-mono text-xs font-medium text-black sm:inline-flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-black" />
            Manuscript Excerpt
          </span>
          <button className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-black">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="font-heading text-3xl leading-tight tracking-wide text-black">
          Chapter 4: Echoes Across Distance
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full w-1/3 rounded-full bg-black" />
          </div>
          <span className="font-code text-xs text-zinc-500">Chapter 4 of 12 • 4 min read</span>
        </div>
      </div>

      <div className="relative my-5 overflow-hidden rounded-xl border border-zinc-200 border-l-4 border-l-black bg-zinc-50 p-6">
        <Quote className="pointer-events-none absolute -left-2 -top-3 select-none text-6xl text-zinc-200" />
        <div className="relative z-10 space-y-3 pl-2">
          <p className="font-body text-lg font-medium italic leading-relaxed text-black">
            &ldquo;कुछ लोग दूर होकर भी बहुत पास रहते हैं। उनसे बात नहीं होती, लेकिन उनकी याद हमेशा साथ रहती है।&rdquo;
          </p>
          <div className="my-2 h-0.5 w-10 bg-zinc-300" />
          <p className="font-body text-base leading-relaxed text-zinc-600">
            &ldquo;Some presences outlast geography. We may stop trading syllables, yet our thoughts
            continue finishing their unspoken sentences.&rdquo;
          </p>
        </div>
      </div>

      <p className="font-body text-base leading-relaxed text-zinc-800">
        We boarded the train with rain smearing against the glass like wet watercolors. I kept watching
        the small station lamps blur into single filaments of amber, wondering if departures carry an
        aroma&mdash;charred coal, damp wool coats, and words swallowed right before whistle-blow.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={clap}
            className={cn(
              "group flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold transition-all active:scale-95",
              liked
                ? "border-black bg-black text-white"
                : "border-zinc-200 bg-zinc-100 text-black hover:bg-black hover:text-white"
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {claps}
          </button>
          <button className="group flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-800 transition-all hover:bg-black hover:text-white">
            <MessageCircle className="h-4 w-4" />
            14
          </button>
          <button
            onClick={() => setSaved((v) => !v)}
            title="Bookmark to Reading List"
            className={cn(
              "rounded-full border border-zinc-200 bg-zinc-100 p-2 transition-colors hover:bg-zinc-200",
              saved ? "text-black" : "text-zinc-600 hover:text-black"
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/book/1">
              <span>Read Full Manuscript</span>
              <ArrowUpRight className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <button
            title="Share Excerpt"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Post 2: audio excerpt with waveform ─────────────────────── */
function AudioPost() {
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:border-zinc-400">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 grayscale ring-1 ring-zinc-300">
            <AvatarFallback className="font-body text-sm">N</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-body text-sm font-bold tracking-tight text-black">Neha Sharma</span>
              <span className="font-code text-xs text-zinc-500">@neha</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="font-body text-xs font-medium text-black">&lsquo;My Little Life&rsquo;</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="font-mono text-xs text-zinc-500">Chapter 8 of 15 • 5h ago</span>
            </div>
          </div>
        </div>

        <span className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 font-mono text-xs font-medium text-black">
          <Headphones className="h-3.5 w-3.5 text-black" />
          Audio Excerpt
        </span>
      </div>

      <div className="mt-5">
        <p className="font-body text-base italic leading-relaxed text-zinc-800">
          &ldquo;Some mornings don&rsquo;t need a reason. Just a hot cup of coffee, the quiet hum of frost
          on the windowpane, and an unbroken silence before the world outside wakes up to its hurried
          routines.&rdquo;
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <button
          onClick={() => setPlaying((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95"
        >
          <Play className={cn("h-[18px] w-[18px] fill-current", playing && "scale-110")} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between pb-1.5 font-mono text-xs">
            <span className="font-semibold uppercase tracking-wide text-black">Author&rsquo;s Narration</span>
            <span className="font-code text-zinc-500">1:45 min</span>
          </div>
          <div className="flex h-6 w-full items-center gap-1">
            {waveform.map(([h, c], i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all",
                  h,
                  playing && i < 8 ? "bg-black" : c
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 font-mono text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-black">
            <Heart className="h-3.5 w-3.5" /> 128 claps
          </button>
          <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-black">
            <MessagesSquare className="h-3.5 w-3.5" /> 29 discussions
          </button>
          <button className="hidden cursor-pointer items-center gap-1 transition-colors hover:text-black sm:flex">
            <Highlighter className="h-3.5 w-3.5" /> 42 highlights
          </button>
        </div>
        <button
          onClick={() => setSaved((v) => !v)}
          className="rounded p-1 transition-colors hover:bg-zinc-100 hover:text-black"
        >
          <BookmarkPlus className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
        </button>
      </div>
    </article>
  );
}

/* ── Post 3: community writing prompt ────────────────────────── */
function PromptPost() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-zinc-300 bg-zinc-50 p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-black px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
            Weekly Prompt #42
          </span>
          <span className="font-body text-xs font-bold uppercase tracking-wide text-zinc-700">
            Speculative Fiction
          </span>
        </div>
        <span className="flex items-center gap-1 font-mono text-xs text-zinc-500">
          <Timer className="h-3.5 w-3.5" />
          3 days remaining
        </span>
      </div>

      <h3 className="mt-4 font-heading text-2xl font-semibold leading-snug text-black">
        &ldquo;Write the opening sentence of a novel where the protagonist realizes their memories are
        being edited by someone else.&rdquo;
      </h3>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <div className="-space-x-2 flex overflow-hidden">
            {promptContributors.map((c) => (
              <span
                key={c.initials}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-[10px] font-semibold ring-2 ring-white",
                  c.className
                )}
              >
                {c.initials}
              </span>
            ))}
          </div>
          <span className="font-code text-xs text-zinc-600">
            <strong className="font-semibold text-black">142 writers</strong> responding
          </span>
        </div>

        <Button asChild>
          <Link to="/write">
            <SquarePen className="h-[18px] w-[18px]" />
            <span>Submit your take</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}

/* ── Right rail widgets ──────────────────────────────────────── */
function SprintWidget() {
  const pct = Math.round((sprint.done / sprint.goal) * 100);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-[18px] w-[18px] text-black" />
          <h3 className="font-heading text-xl font-semibold tracking-wide text-black">Writing Sprint</h3>
        </div>
        <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-black">
          {sprint.streak}-day streak
        </span>
      </div>

      <p className="mt-2 font-mono text-xs text-zinc-500">Daily Word Goal: {sprint.goal.toLocaleString()} words</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-code text-xs font-bold text-black">
            {sprint.done} <span className="font-normal text-zinc-400">/ {sprint.goal.toLocaleString()} words</span>
          </span>
          <span className="font-code text-xs font-bold text-black">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
          <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Button variant="secondary" className="mt-4 w-full">
        <Users className="h-[18px] w-[18px]" />
        <span>Join 15-min Sprint room</span>
      </Button>
    </div>
  );
}

function TrendingWidget() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="font-heading text-xl font-semibold tracking-wide text-black">Trending Volumes</h3>
        <button className="font-mono text-xs uppercase tracking-wider text-zinc-500 transition-colors hover:text-black">
          View all
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {trendingBooks.map((book, i) => (
          <div key={book.id} className="group flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-4 font-mono text-sm font-semibold text-zinc-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-col">
                <Link
                  to={`/book/${book.id}`}
                  className="truncate font-body text-sm font-bold text-black group-hover:underline"
                >
                  {book.title}
                </Link>
                <span className="truncate font-code text-xs text-zinc-500">{book.meta}</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0">
              +Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MentorsWidget() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <h3 className="font-heading text-xl font-semibold tracking-wide text-black">Mentors &amp; Voices</h3>
        <Star className="h-4 w-4 text-zinc-400" />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {mentors.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10 grayscale ring-1 ring-zinc-300">
                <AvatarFallback className="font-mono text-xs">{m.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-body text-sm font-bold text-black">{m.name}</span>
                <span className="truncate font-code text-xs text-zinc-500">{m.meta}</span>
              </div>
            </div>
            <button
              title={`Follow ${m.name}`}
              className="rounded-full border border-zinc-200 p-2 text-black transition-colors hover:bg-zinc-100"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RailFooter() {
  return (
    <footer className="flex flex-col gap-2 p-2 text-center font-body text-xs text-zinc-500 lg:text-left">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:justify-start">
        <a href="#" className="transition-colors hover:text-black">Manuscript Guidelines</a>
        <span>•</span>
        <a href="#" className="transition-colors hover:text-black">Beta Reading Guild</a>
        <span>•</span>
        <a href="#" className="transition-colors hover:text-black">Literary Salon</a>
      </div>
      <p className="font-mono text-[11px] text-zinc-400">© 2025 Folio. Strict monochrome edition.</p>
    </footer>
  );
}

/* ── Motto ────────────────────────────────────────────────────── */
function Motto() {
  return (
    <blockquote className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <Quote className="h-4 w-4 text-zinc-300" aria-hidden="true" />
      <p className="mt-3 font-heading text-base leading-relaxed text-zinc-800">
        A writer only knows writing.
      </p>
      <footer className="mt-3 font-mono text-label-xs uppercase tracking-widest text-zinc-400">
        The Writer&rsquo;s Creed
      </footer>
    </blockquote>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
function HomePage() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
        <StreamTabs />
        <Composer />
        <div className="flex flex-col gap-6">
          <ExcerptPost />
          <AudioPost />
          <PromptPost />
        </div>
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-4">
        <Motto />
        <SprintWidget />
        <TrendingWidget />
        <MentorsWidget />
        <RailFooter />
      </aside>
    </div>
  );
}

export { HomePage };
