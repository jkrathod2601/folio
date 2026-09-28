import { useEffect, useState } from "react";
import { normalizeHex } from "@/lib/bookDesign";
import { formLabel } from "@/components/Field";

/**
 * One colour: a native picker plus a free-typed hex field.
 *
 * The text field keeps its own draft while the author types. Committing on
 * every keystroke straight to the parent would make the field untypable: no
 * prefix of "#4c1d24" is valid hex, so each character would be rejected and the
 * value would snap back to the old colour after every press.
 */
function Swatch({ value, onChange, label: text, id }) {
  // The text field keeps its own draft while the author types. Committing on
  // every keystroke straight to the parent would make the field untypable: no
  // prefix of "#4c1d24" is valid hex, so each character would be rejected and
  // the value would snap back to the old colour after every press.
  const [draft, setDraft] = useState(value);

  // Follow the parent when it changes from elsewhere — a palette swatch, or the
  // "fix contrast" button. The `value` check is what distinguishes "the author
  // is mid-edit" from "something else moved the color".
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw) => {
    const next = normalizeHex(raw);
    if (next) onChange(next);
  };

  return (
    <div>
      <label htmlFor={id} className={formLabel}>
        {text}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setDraft(e.target.value);
          }}
          className="h-7 w-9 cursor-pointer rounded border border-zinc-300 bg-transparent p-0"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            // Leaving the field is the commit point. An unparseable draft falls
            // back to the last good value rather than being submitted.
            commit(draft) || setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
              setDraft(value);
              e.currentTarget.blur();
            }
          }}
          aria-label={`${text} hex value`}
          aria-invalid={normalizeHex(draft) === null}
          spellCheck={false}
          maxLength={7}
          className="w-full min-w-0 bg-transparent font-code text-xs uppercase text-zinc-800 outline-none"
        />
      </div>
    </div>
  );
}

export { Swatch as ColorSwatch };
