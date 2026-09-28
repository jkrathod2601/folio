import { Field, formField } from "@/components/Field";
import { SubGroup } from "@/components/FormGroup";
import { TagPicker } from "@/components/TagPicker";

/**
 * Optional descriptive metadata for a book.
 *
 * Every field here is optional and every one defaults to empty, on purpose: the
 * common case is a book the author has just started and has not decided any of
 * this yet. A single required field would get filled with a placeholder nobody
 * means, and a placeholder in `language` is worse than a blank one.
 *
 * The split is by *use*, not by data type, because that is the only reason to
 * fill any of them in:
 *
 *   - "About the book"  — themes, moods, motifs, content warnings. What a reader
 *                         scans, and what an author uses to work out what the
 *                         book is actually about.
 *   - "Language & series" — the two facts that make a shelf of books browsable
 *                         when it is more than one book.
 *   - "The cover"       — credit and rights. Separate from the image because a
 *                         book may ship with a photograph the author does not
 *                         own, and the credit has to travel with it.
 *   - "Publication"     — publisher, date, ISBN, edition. Empty for most books
 *                         here, and honestly so.
 *
 * Language is free text with suggestions rather than a closed list of locales,
 * for the same reason genres are: "Hindustani", "Bhojpuri" and "Urdu (Roman)"
 * are all real answers for a Hindi/Urdu shelf, and a dropdown would make the
 * author pick the nearest wrong one.
 */

const LANGUAGES = [
  "Hindi",
  "Urdu",
  "English",
  "Hindustani",
  "Bhojpuri",
  "Punjabi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Sanskrit",
];

const THEME_SUGGESTIONS = [
  "grief",
  "memory",
  "exile",
  "family",
  "love",
  "loss",
  "identity",
  "home",
  "time",
  "death",
  "hope",
  "loneliness",
];

const MOOD_SUGGESTIONS = [
  "wistful",
  "tender",
  "bleak",
  "hopeful",
  "playful",
  "anxious",
  "serene",
  "bittersweet",
];

const MOTIF_SUGGESTIONS = [
  "letters",
  "river",
  "journey",
  "music",
  "food",
  "dreams",
  "rain",
  "secrets",
];

const WARNING_SUGGESTIONS = [
  "grief",
  "illness",
  "death",
  "violence",
  "abuse",
  "suicide",
  "sexual content",
  "discrimination",
];

const AGE_RATINGS = [
  { key: "", label: "Not set" },
  { key: "everyone", label: "Everyone" },
  { key: "teen", label: "Teen" },
  { key: "mature", label: "Mature" },
  { key: "adult", label: "Adult" },
];

const COVER_RIGHTS = [
  { key: "", label: "Not stated" },
  { key: "owned", label: "I made it" },
  { key: "licensed", label: "Licensed" },
  { key: "public-domain", label: "Public domain" },
  { key: "permission", label: "With permission" },
  { key: "unknown", label: "Unknown" },
];

/** Suggestion chips for a single-value field: click to fill. */
function Suggestions({ values, onPick }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className="rounded-full border border-zinc-200 px-2.5 py-0.5 font-code text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:border-zinc-500 hover:bg-zinc-100"
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function BookMetadataFields({ value, onChange }) {
  const set = (key) => (next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-6">
      <SubGroup title="About the book" hint="What a reader scans, and what helps you work out what the book is.">
        <Field htmlFor="book-themes" label="Themes" hint="optional, up to 12">
          <TagPicker
            id="book-themes"
            value={value.themes}
            onChange={set("themes")}
            max={12}
            label="theme"
            suggestions={THEME_SUGGESTIONS}
          />
        </Field>

        <Field htmlFor="book-moods" label="Moods" hint="optional, up to 12">
          <TagPicker
            id="book-moods"
            value={value.moods}
            onChange={set("moods")}
            max={12}
            label="mood"
            suggestions={MOOD_SUGGESTIONS}
          />
        </Field>

        <Field htmlFor="book-motifs" label="Motifs" hint="optional — the images that keep recurring">
          <TagPicker
            id="book-motifs"
            value={value.motifs}
            onChange={set("motifs")}
            max={12}
            label="motif"
            suggestions={MOTIF_SUGGESTIONS}
          />
        </Field>

        <Field
          htmlFor="book-warnings"
          label="Content warnings"
          hint="optional, up to 20"
        >
          <TagPicker
            id="book-warnings"
            value={value.contentWarnings}
            onChange={set("contentWarnings")}
            max={20}
            label="warning"
            suggestions={WARNING_SUGGESTIONS}
          />
        </Field>
      </SubGroup>

      <SubGroup title="Language & series" hint="The two facts that make a shelf browsable.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="book-language" label="Language" hint="optional">
            <input
              id="book-language"
              value={value.language}
              onChange={(e) => set("language")(e.target.value)}
              placeholder="Hindi"
              list="book-language-suggestions"
              className={formField}
            />
            <datalist id="book-language-suggestions">
              {LANGUAGES.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            <Suggestions values={LANGUAGES.slice(0, 6)} onPick={set("language")} />
          </Field>

          <Field
            htmlFor="book-original-language"
            label="Original language"
            hint="optional, when it differs"
          >
            <input
              id="book-original-language"
              value={value.originalLanguage}
              onChange={(e) => set("originalLanguage")(e.target.value)}
              placeholder="Urdu"
              className={formField}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="book-series" label="Series" hint="optional">
            <input
              id="book-series"
              value={value.series}
              onChange={(e) => set("series")(e.target.value)}
              placeholder="Kahaniyan"
              className={formField}
            />
          </Field>

            <Field
              htmlFor="book-series-index"
              label="Book in series"
              hint={value.series ? "optional" : "set a series first"}
            >
              <input
                id="book-series-index"
                type="number"
                min={1}
                value={value.seriesIndex ?? ""}
                disabled={!value.series}
                onChange={(e) => {
                  // The server validates this as an integer >= 1. A number input
                  // happily types "1.5" or "0", which would fail validation with
                  // no way for the author to see why — so clamp here instead of
                  // shipping a value the form cannot represent.
                  if (e.target.value === "") return set("seriesIndex")(null);
                  const n = Math.floor(Number(e.target.value));
                  set("seriesIndex")(Number.isFinite(n) && n >= 1 ? n : null);
                }}
                placeholder="1"
                className={`${formField} disabled:opacity-50`}
              />
            </Field>
        </div>
      </SubGroup>

      <SubGroup
        title="The cover"
        hint="Attribution for a cover image you did not make."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="book-cover-credit" label="Cover credit" hint="optional">
            <input
              id="book-cover-credit"
              value={value.coverCredit}
              onChange={(e) => set("coverCredit")(e.target.value)}
              placeholder="Photograph by A. Kumar"
              className={formField}
            />
          </Field>

          <Field htmlFor="book-cover-rights" label="Cover rights" hint="optional">
            <select
              id="book-cover-rights"
              value={value.coverRights}
              onChange={(e) => set("coverRights")(e.target.value)}
              className={formField}
            >
              {COVER_RIGHTS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SubGroup>

      <SubGroup title="Publication" hint="Optional. Empty for a book nobody has published yet.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="book-publisher" label="Publisher" hint="optional">
            <input
              id="book-publisher"
              value={value.publisher}
              onChange={(e) => set("publisher")(e.target.value)}
              placeholder="Vani Press"
              className={formField}
            />
          </Field>

          <Field htmlFor="book-published-at" label="Published" hint="optional">
            <input
              id="book-published-at"
              type="date"
              value={(value.publishedAt ?? "").slice(0, 10)}
              onChange={(e) => set("publishedAt")(e.target.value || null)}
              className={formField}
            />
          </Field>

          <Field htmlFor="book-isbn" label="ISBN" hint="optional">
            <input
              id="book-isbn"
              value={value.isbn}
              onChange={(e) => set("isbn")(e.target.value)}
              placeholder="9780000000000"
              inputMode="numeric"
              className={`${formField} font-code text-xs`}
            />
          </Field>

          <Field htmlFor="book-edition" label="Edition" hint="optional">
            <input
              id="book-edition"
              value={value.edition}
              onChange={(e) => set("edition")(e.target.value)}
              placeholder="1st edition"
              className={formField}
            />
          </Field>
        </div>

        <Field htmlFor="book-age-rating" label="Age rating" hint="optional">
          <div className="flex flex-wrap gap-2">
            {AGE_RATINGS.map((o) => (
              <button
                key={o.key || "none"}
                type="button"
                onClick={() => set("ageRating")(o.key)}
                aria-pressed={value.ageRating === o.key}
                className={`rounded-lg border px-3 py-1.5 font-code text-[11px] uppercase tracking-wider transition-colors ${
                  value.ageRating === o.key
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
      </SubGroup>
    </div>
  );
}

/** The empty shape, so the form never has to guard each field individually. */
export const EMPTY_METADATA = {
  language: "",
  originalLanguage: "",
  series: "",
  seriesIndex: null,
  themes: [],
  moods: [],
  motifs: [],
  contentWarnings: [],
  ageRating: "",
  coverCredit: "",
  coverRights: "",
  publisher: "",
  publishedAt: null,
  isbn: "",
  edition: "",
};

/**
 * Is this metadata field actually filled in?
 *
 * Deliberately not `Boolean(value)`. Four of these fields are arrays, and an
 * empty array is truthy in JavaScript, so a plain truthiness count reports
 * `themes: []`, `moods: []`, `motifs: []` and `contentWarnings: []` as four
 * completed fields on a book that has none — which opened the "About this book"
 * group by default and put a misleading "4" badge on it, defeating the whole
 * point of collapsing it. `0` has the same trap for `seriesIndex`.
 */
const isFilled = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return Boolean(value);
};

/** How many metadata fields hold something. */
export const countFilledMetadata = (metadata) =>
  Object.values(metadata ?? {}).filter(isFilled).length;
