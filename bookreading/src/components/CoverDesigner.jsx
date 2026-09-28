import {
  PALETTES,
  LAYOUTS,
  TITLE_SCALES,
  ORNAMENTS,
  contrastRatio,
  isReadable,
  suggestTextColor,
} from "@/lib/bookDesign";
import { ColorSwatch } from "@/components/ColorSwatch";
import { CoverImageUpload } from "@/components/CoverImageUpload";
import { cn } from "@/lib/utils";

/**
 * The cover design panel: uploaded image, palette, colours, ornament, layout,
 * title size, blurb.
 *
 * Shared by "new book" and "edit book" on purpose. Both need these exact
 * controls, and two copies would drift — the failure mode being an *old* book
 * quietly offering different options from a new one, so authors would have to
 * re-design covers to reach a setting that moved.
 *
 * `bookId` gates the image upload: a cover can only be attached to a book that
 * already exists, so create hides this and shows the generated design until the
 * first save, at which point edit (or the create flow's second step) can attach
 * an image.
 */
export function CoverDesigner({ design, onChange, bookId, hasCover, coverUrl, onCoverChange, disabled }) {
  const set = (patch) => onChange({ ...design, ...patch });

  const contrast = contrastRatio(design.textColor, design.coverColor);
  const readable = isReadable(design.textColor, design.coverColor);

  return (
    <div className="space-y-5">
      {bookId && (
        <CoverImageUpload
          bookId={bookId}
          hasCover={hasCover}
          coverUrl={coverUrl}
          onChange={onCoverChange}
          disabled={disabled}
        />
      )}

      <div>
        <span className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
          Palette
        </span>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => {
            const active =
              design.coverColor === p.cover &&
              design.textColor === p.text &&
              design.accentColor === p.accent;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => set({ coverColor: p.cover, textColor: p.text, accentColor: p.accent })}
                aria-pressed={active}
                aria-label={`${p.label} palette`}
                title={p.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-transform",
                  active
                    ? "border-zinc-950 scale-105"
                    : "border-zinc-200 hover:border-zinc-400"
                )}
                style={{ background: p.cover }}
              >
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.text }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ColorSwatch
          id="cover-color"
          label="Cover"
          value={design.coverColor}
          onChange={(v) => set({ coverColor: v })}
        />
        <ColorSwatch
          id="text-color"
          label="Text"
          value={design.textColor}
          onChange={(v) => set({ textColor: v })}
        />
        <ColorSwatch
          id="accent-color"
          label="Accent"
          value={design.accentColor ?? design.textColor}
          onChange={(v) => set({ accentColor: v })}
        />
      </div>

      {!readable && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5">
          <p className="flex-1 font-code text-[11px] leading-relaxed text-zinc-700">
            Title on cover is {contrast.toFixed(1)}:1. Large text wants 3:1 to stay
            legible in print.
          </p>
          <button
            type="button"
            onClick={() => set({ textColor: suggestTextColor(design.coverColor, design.textColor) })}
            className="rounded-lg bg-zinc-950 px-3 py-1.5 font-code text-[10px] uppercase tracking-wider text-white transition-colors hover:bg-zinc-800"
          >
            Fix contrast
          </button>
        </div>
      )}

      <div>
        <span className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
          Ornament
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ORNAMENTS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => set({ ornament: o.key })}
              aria-pressed={design.ornament === o.key}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-code text-[10px] uppercase tracking-wider transition-colors",
                design.ornament === o.key
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
          Layout
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LAYOUTS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => set({ layout: l.key })}
              aria-pressed={design.layout === l.key}
              title={l.hint}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                design.layout === l.key
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"
              )}
            >
              <span className="font-code text-[10px] uppercase tracking-wider">{l.label}</span>
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  design.layout === l.key ? "text-zinc-300" : "text-zinc-500"
                )}
              >
                {l.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
          Title size
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TITLE_SCALES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => set({ titleScale: t.key })}
              aria-pressed={design.titleScale === t.key}
              className={cn(
                "rounded-full border px-3 py-1.5 font-code text-[10px] uppercase tracking-wider transition-colors",
                design.titleScale === t.key
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5">
        <input
          type="checkbox"
          checked={design.showBlurb}
          onChange={(e) => set({ showBlurb: e.target.checked })}
          className="h-4 w-4 accent-zinc-950"
        />
        <span className="font-body text-sm text-zinc-800">Print the blurb on the cover</span>
      </label>
    </div>
  );
}
