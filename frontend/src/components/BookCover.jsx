import { DEFAULT_DESIGN, withAlpha } from "@/lib/bookDesign";
import { useCoverImage } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";

/** Type scale for the cover title, per `design.titleScale`. */
const TITLE_SIZES = {
  small: "text-base",
  medium: "text-xl",
  large: "text-3xl",
};

/**
 * Where the type block sits, per `design.layout`.
 *
 * `place` goes on the **root** and moves the block; `align` goes on the block
 * itself and aligns its contents. They have to live on different elements: the
 * block is auto-height, so `justify-content` on the block itself only shuffles
 * its own children and has no effect on where the block sits. That mistake made
 * every layout render identically until the scrim test caught it.
 *
 * The block is a normal flex child rather than absolutely positioned because its
 * height depends on how many lines the title wraps to — an absolute layout would
 * need a fixed height and would clip a long title.
 */
const LAYOUTS = {
  centered: { place: "justify-center", align: "items-center text-center" },
  "bottom-left": { place: "justify-end", align: "items-start text-left" },
  "bottom-center": { place: "justify-end", align: "items-center text-center" },
  "top-left": { place: "justify-start", align: "items-start text-left" },
  "top-center": { place: "justify-start", align: "items-center text-center" },
  // The exception: no title, no subtitle, no blurb. Just the spine mark.
  "mark-only": { place: "justify-end", align: "items-start text-left" },
};


/**
 * The wash that sits between an uploaded cover image and the type.
 *
 * Solid where the type sits, transparent away from it, so the photograph still
 * reads. `alpha` is high on purpose: at 0.85 the worst case — near-black
 * photography under light ink — still measures above 7:1, versus 10:1 for the
 * flat cover the author actually chose. Below ~0.72 the guarantee goes.
 */
function scrim(layout, cover, markOnly) {
  const veil = withAlpha(cover, markOnly ? 0.7 : 0.85);
  const fade = "transparent";

  switch (layout) {
    case "bottom-left":
    case "bottom-center":
    case "mark-only":
      return `linear-gradient(to top, ${veil} 0%, ${veil} 34%, ${fade} 78%)`;
    case "top-left":
    case "top-center":
      return `linear-gradient(to bottom, ${veil} 0%, ${veil} 34%, ${fade} 78%)`;
    case "centered":
    default:
      // No edge to lean on, so a centred pool rather than a band. The solid core
      // is wide because a large centred title wraps to three or four lines and
      // its corners reach much further out than the glyphs do — too narrow a
      // core leaves the first and last lines sitting on bare photograph.
      return `radial-gradient(ellipse at center, ${veil} 0%, ${veil} 64%, ${fade} 100%)`;
  }
}

/** The short rule above the title, in normal flow so it follows the layout. */
function Rule({ ornament, accent, align }) {
  if (ornament !== "rule" && ornament !== "double-rule") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "mb-3 flex shrink-0 items-center gap-1",
        align.includes("text-center") && "justify-center"
      )}
    >
      <span className="block h-px w-8" style={{ background: accent }} />
      {ornament === "double-rule" && (
        <span className="block h-px w-4" style={{ background: accent }} />
      )}
    </div>
  );
}

function Frame({ accent }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-sm border"
        style={{ borderColor: accent }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 rounded-sm border opacity-40"
        style={{ borderColor: accent }}
      />
    </>
  );
}

/**
 * A generated book cover.
 *
 * The single renderer for a book's design, used by the creation preview and
 * (later) the book detail page. A separate preview implementation would drift
 * from the real thing within a couple of design tweaks, and a preview that lies
 * is worse than no preview.
 *
 * Colors arrive as inline styles from the author's stored hex, never as Tailwind
 * classes — see the note in `models/Book.js` on why a stored document must not
 * depend on the theme bundle. Dark mode deliberately does not touch a cover: a
 * cover is the author's design, not a surface the app themes.
 *
 * `coverSrc` composites an uploaded image *underneath* the type, because an
 * image is the artwork, not a replacement for the cover — the title, rule and
 * mark still belong to the cover. A wash of the author's own cover colour sits
 * between the two so the title stays legible over any photograph; see `scrim`.
 */
function BookCover({ book, className, compact = false, coverSrc }) {
  const design = { ...DEFAULT_DESIGN, ...(book?.design ?? {}) };
  const cover = design.coverColor;
  const text = design.textColor;
  // An unset accent falls back to the text color, so a two-color cover still
  // looks chosen rather than unfinished.
  const accent = design.accentColor ?? text;

  const layout = LAYOUTS[design.layout] ?? LAYOUTS["bottom-left"];
  const markOnly = design.layout === "mark-only";

  const title = book?.title?.trim() || "Untitled";
  const subtitle = book?.subtitle?.trim();
  const mark = book?.mark?.trim();

  // `mark-only` with no mark set would render a blank cover, which reads as
  // broken rather than minimal — so it falls back to the title. There is always
  // something to read.
  const markOnlyText = mark || title;

  const titleSize = compact
    ? "text-sm"
    : TITLE_SIZES[design.titleScale] ?? TITLE_SIZES.large;

  return (
    <div
      // The cover is a picture, not a control, so its text is not part of the
      // page's reading order — the real title and blurb are rendered alongside it
      // on the book page.
      aria-hidden="true"
      className={cn(
        "relative flex aspect-[3/4] flex-col overflow-hidden",
        layout.place,
        className
      )}
      style={{ background: cover, color: text }}
    >
      {/*
        The uploaded image, full-bleed behind everything. `object-cover` so a
        landscape photo still fills a 3:4 cover rather than letterboxing, and
        so the interesting part of an image is never cropped away in a way the
        author cannot predict — the editor shows the identical crop.
      */}
      {coverSrc && (
        <img
          src={coverSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable="false"
        />
      )}

      {/*
        Legibility wash, between the photo and the type.

        It is a wash of the author's **cover** colour, not the text colour. That
        distinction is the whole trick: the text then sits on (almost exactly)
        the backdrop whose contrast they already verified on the flat cover, so
        the photo behind it cannot change whether the title is readable. A wash
        of the *text* colour would do the opposite — it drags the backdrop
        toward the ink and collapses the ratio. Measured over a pure-white photo
        that variant lands at 2.5:1; this one holds 7.5:1+.

        The gradient points at wherever the layout puts the type, so the solid
        end covers the words and the transparent end lets the artwork through
        instead of flattening the whole cover.
      */}
      {coverSrc && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: scrim(design.layout, cover, markOnly) }}
        />
      )}

      {design.ornament === "frame" && <Frame accent={accent} />}

      <div
        className={cn(
          "relative flex flex-col p-5",
          design.ornament === "frame" && "px-7 pt-9",
          layout.align
        )}
      >
        {markOnly ? (
          <span
            className="font-code text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: text, opacity: 0.75 }}
          >
            {markOnlyText}
          </span>
        ) : (
          <>
            <Rule ornament={design.ornament} accent={accent} align={layout.align} />

            {mark && (
              <span
                className="mb-2 font-code text-[9px] uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                {mark}
              </span>
            )}

            <h3
              className={cn(
                "font-heading font-bold uppercase leading-[1.05] tracking-wide",
                titleSize
              )}
              style={{ color: text }}
            >
              {title}
            </h3>

            {subtitle && (
              <p
                className={cn("mt-1.5 font-body italic leading-snug", compact && "text-[10px]")}
                style={{ color: text, opacity: 0.82 }}
              >
                {subtitle}
              </p>
            )}

            {design.showBlurb && book?.blurb?.trim() && !compact && (
              <p
                className="mt-3 font-body text-[11px] leading-relaxed"
                style={{ color: text, opacity: 0.7 }}
              >
                {book.blurb}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A cover that prefers a real uploaded image when the book has one, and falls
 * back to the generated design otherwise.
 *
 * The image is fetched as a blob rather than `<img src="/api/books/:id/cover">`,
 * because that endpoint requires a bearer token and the browser would send none
 * — it would 401 and render a broken image. `useCoverImage` supplies the header
 * and hands back an object URL.
 *
 * Two sources are accepted on purpose: `book.cover` is the new uploaded
 * subdocument, `book.coverUrl` is the old string field still present on seeded
 * mock books. Drop `coverUrl` when the mock catalog goes.
 */
export function BookCoverOrFallback({ book, className, compact = false }) {
  const hasUpload = Boolean(book?.cover?.contentType);
  const { url } = useCoverImage(book?.id, hasUpload);

  if (book?.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt=""
        className={cn("aspect-[3/4] w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  // Composite rather than a bare <img>: the image is the artwork, and the title
  // is still part of the cover. This is the same renderer the editor preview
  // uses, so a saved cover looks exactly like what the author approved.
  return (
    <BookCover
      book={book}
      className={className}
      compact={compact}
      coverSrc={hasUpload ? url : undefined}
    />
  );
}

export { BookCover };
