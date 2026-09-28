import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Free-text tag list: chips, a text input, and optional suggestion chips.
 *
 * Generic on purpose. `genres`, `themes`, `moods`, `motifs`, `contentWarnings`
 * and an entity's `tags` are all the same control with a different noun and a
 * different cap, and they were about to become five copies of `GenrePicker`.
 * One implementation means the Enter-to-add behaviour, the case-insensitive
 * dedupe and the backspace-to-remove shortcut cannot drift between them.
 *
 * Suggestions are a convenience, never a vocabulary. A closed list would reject
 * "Adhunik Kavita" and quietly push the author to the nearest wrong answer.
 */
export function TagPicker({
  value = [],
  onChange,
  max = 12,
  itemMaxLength = 60,
  label = "tag",
  suggestions = [],
  suggestionCount = 8,
  placeholder,
  error,
  id,
}) {
  const [draft, setDraft] = useState("");

  const atLimit = value.length >= max;

  const add = (raw) => {
    const clean = String(raw).trim().replace(/\s+/g, " ");
    if (!clean || atLimit) return;
    if (clean.length > itemMaxLength) return;
    // Case-insensitive, so "Poetry" and "poetry" cannot both land.
    if (value.some((v) => v.toLowerCase() === clean.toLowerCase())) return;
    onChange([...value, clean]);
    setDraft("");
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const remaining = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2.5">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 py-1 pl-3 pr-1.5 font-code text-[11px] uppercase tracking-wider text-white">
                {tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                  className="rounded-full p-0.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Without this, Enter submits the whole book form from inside a tag
            // field, which is not what pressing Enter after a theme means.
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
            if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          disabled={atLimit}
          placeholder={
            placeholder ??
            (atLimit ? `Maximum ${max} ${label}s` : `Type a ${label}, then press Enter`)
          }
          aria-label={`Add a ${label}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id ?? label}-error` : undefined}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-body text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => add(draft)}
          disabled={!draft.trim() || atLimit}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 font-code text-[11px] uppercase tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remaining.slice(0, suggestionCount).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              disabled={atLimit}
              className={cn(
                "rounded-full border border-zinc-200 px-3 py-1 font-code text-[10px] uppercase tracking-wider text-zinc-600",
                "transition-colors hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p id={`${id ?? label}-error`} className="font-code text-[11px] text-zinc-700">
          {error}
        </p>
      )}
    </div>
  );
}
