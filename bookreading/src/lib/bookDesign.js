/**
 * Book cover design vocabulary.
 *
 * Kept out of the form component so the cover renderer and the editor read the
 * same lists. If these diverge, the preview stops predicting the real cover,
 * which is the one thing a live preview exists to prevent.
 *
 * No React imports here. This module is imported by the editor, by the cover
 * renderer, and by the model contract, so it must stay free of both React and
 * lucide.
 */

/**
 * Cover layouts.
 *
 * These replaced the old per-book `shape` — a `book`/`pen`/`note` glyph picked
 * from an icon set. A glyph tells a reader what kind of book something is before
 * they have read the title, which is a strange thing for a book to assert about
 * itself. A layout only says where the type sits.
 *
 * `mark` on each entry is the ASCII sketch used in the layout picker, so the
 * choice is legible in the button and not just in the preview.
 */
export const LAYOUTS = [
  { key: "centered", label: "Centred", mark: "\u00b7\u00b7\u00b7\nTITLE\n\u00b7\u00b7\u00b7", hint: "Type stacked in the middle" },
  { key: "bottom-left", label: "Bottom left", mark: "", hint: "The common default" },
  { key: "bottom-center", label: "Bottom centre", mark: "\nTITLE", hint: "Optically centred, sits low" },
  { key: "top-left", label: "Top left", mark: "TITLE\n", hint: "Title first, space below" },
  { key: "top-center", label: "Top centre", mark: "TITLE\n\n", hint: "Centred and high" },
  { key: "mark-only", label: "Mark only", mark: "\n\n\n\n\nVOL I", hint: "Just the spine mark, no title" },
];

export const TITLE_SCALES = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
];

export const ORNAMENTS = [
  { key: "none", label: "None" },
  { key: "rule", label: "Rule" },
  { key: "double-rule", label: "Double rule" },
  { key: "frame", label: "Frame" },
];

/**
 * Starting palettes.
 *
 * The first four are the monochrome pairs the rest of the app already uses, so
 * a book that touches nothing still looks native. The rest exist because a
 * cover is the one surface in Folio where an author reasonably wants a colour,
 * and pretending otherwise would just push people to hand-type hex anyway.
 */
export const PALETTES = [
  { key: "ink", label: "Ink", cover: "#09090b", text: "#ffffff", accent: "#a1a1aa" },
  { key: "paper", label: "Paper", cover: "#fafaf9", text: "#18181b", accent: "#71717a" },
  { key: "slate", label: "Slate", cover: "#334155", text: "#f8fafc", accent: "#cbd5e1" },
  { key: "sand", label: "Sand", cover: "#d6c7a1", text: "#1c1917", accent: "#57534e" },
  { key: "oxblood", label: "Oxblood", cover: "#4c1d24", text: "#fdf2f4", accent: "#d9a3ac" },
  { key: "forest", label: "Forest", cover: "#14342b", text: "#ecfdf5", accent: "#7fbfa6" },
  { key: "indigo", label: "Indigo", cover: "#1e1b4b", text: "#eef2ff", accent: "#a5b4fc" },
  { key: "rust", label: "Rust", cover: "#7c2d12", text: "#fff7ed", accent: "#fdba74" },
];

/** Matches the backend's `design` defaults so the form starts where the model does. */
export const DEFAULT_DESIGN = {
  coverColor: "#09090b",
  textColor: "#ffffff",
  accentColor: "#a1a1aa",
  layout: "bottom-left",
  ornament: "rule",
  titleScale: "large",
  showBlurb: false,
};

export const MAX_GENRES = 8;

/* ------------------------------------------------------------------ *
 * Contrast helpers
 *
 * A cover is arbitrary user-chosen colors, so the editor has to be able to say
 * "that title will be invisible" instead of rendering a black-on-black preview
 * and letting the author find out after they published.
 * ------------------------------------------------------------------ */

/** WCAG relative luminance for a `#rrggbb` string. */
function luminance(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  if (!m) return 0;

  const channel = (c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel(m[1]) + 0.7152 * channel(m[2]) + 0.0722 * channel(m[3])
  );
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Black or white, whichever is more readable on `hex`. */
export function readableInk(hex) {
  return contrastRatio(hex, "#000000") >= contrastRatio(hex, "#ffffff")
    ? "#000000"
    : "#ffffff";
}

/**
 * Whether a color pair clears large-text WCAG AA (3:1).
 *
 * 3:1 rather than 4.5:1 because cover titles are large display type, which is
 * the case AA actually sets the threshold for.
 */
export function isReadable(textColor, coverColor) {
  return contrastRatio(textColor, coverColor) >= 3;
}

/**
 * Best text color for a cover, used by the "fix it" button.
 *
 * Prefers the author's own pick when it already passes, so the suggestion never
 * overrides a deliberate choice that happens to be low-contrast but intentional.
 */
export function suggestTextColor(coverColor, currentTextColor) {
  if (isReadable(currentTextColor, coverColor)) return currentTextColor;
  return readableInk(coverColor);
}

/** Normalizes a color input to lowercase 6-digit hex, or null if unusable. */
export function normalizeHex(value) {
  const m = /^#?([0-9a-f]{6})$/i.exec((value ?? "").trim());
  return m ? `#${m[1].toLowerCase()}` : null;
}

/**
 * Hex to `rgba()` at a given alpha.
 *
 * Used for the legibility veil that sits between an uploaded cover image and
 * the title drawn on top of it. The veil is a wash of the *text* colour, so the
 * title keeps the contrast relationship the author chose and verified — the
 * image behind it becomes irrelevant to legibility. A veil of some fixed
 * neutral instead would quietly override the author's colour decision.
 *
 * Returns the input unchanged if it is not parseable hex, so a bad stored value
 * degrades to "no veil" rather than to `rgba(undefined)`.
 */
export function withAlpha(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
