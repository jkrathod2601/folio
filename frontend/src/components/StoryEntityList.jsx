import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { newEntityKey } from "@/hooks/useStoryEntities";

/**
 * Add / edit / reorder / remove list editor for a story-bible collection.
 *
 * Generic because characters, places and sections are the same interaction with
 * different fields, and a bespoke component per collection would be three
 * places to fix the same "moving an item up does not reorder it" bug.
 *
 * **`key` is minted on create and never changes.** The server reconciles a save
 * by that key, so a stable key is what makes an edit an update rather than a
 * delete plus an insert — which matters because a character that gets a new
 * `_id` on every save is a character that loses its uploaded portrait.
 *
 * Reordering rewrites the array in place and the server derives `order` from
 * array position, so the author's arrangement is stored exactly as shown.
 */
export function StoryEntityList({
  items,
  onChange,
  createEmpty,
  singular,
  plural,
  renderBody,
  renderSummary,
  emptyHint,
  disabled,
  max = 100,
}) {
  const [openFor, setOpenFor] = useState(null);

  const atLimit = items.length >= max;

  const add = () => {
    if (atLimit) return;
    const item = { key: newEntityKey(), ...createEmpty() };
    onChange([...items, item]);
    setOpenFor(item.key);
  };

  const update = (key, patch) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const remove = (key) => {
    onChange(items.filter((item) => item.key !== key));
    if (openFor === key) setOpenFor(null);
  };

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-3.5 py-4 font-body text-xs leading-relaxed text-zinc-500">
          {emptyHint}
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item, index) => {
          const open = openFor === item.key;
          const label = renderSummary(item);

          return (
            <li key={item.key} className="rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span className="w-5 shrink-0 text-center font-code text-[10px] text-zinc-400">
                  {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => setOpenFor(open ? null : item.key)}
                  aria-expanded={open}
                  className="min-w-0 flex-1 truncate py-1 text-left font-body text-sm text-zinc-950"
                >
                  {label}
                </button>

                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || disabled}
                  aria-label={`Move ${label} up`}
                  className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-25"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1 || disabled}
                  aria-label={`Move ${label} down`}
                  className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-25"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.key)}
                  disabled={disabled}
                  aria-label={`Remove ${label}`}
                  className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {open && (
                <div className="space-y-3.5 border-t border-zinc-200 px-3 py-3">
                  {renderBody(item, (patch) => update(item.key, patch), { disabled })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={add}
        disabled={atLimit || disabled}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2",
          "font-code text-[11px] uppercase tracking-wider text-zinc-600",
          "transition-colors hover:border-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        {atLimit ? `Maximum ${max} ${plural}` : `Add a ${singular}`}
      </button>
    </div>
  );
}

/** A select for a short fixed vocabulary. */
export function ChoiceField({ id, label, hint, value, onChange, options, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
        {label}
        {hint && <span className="normal-case tracking-normal text-zinc-500"> {hint}</span>}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-body text-sm text-zinc-950 outline-none focus:border-zinc-500 disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Busy indicator used inside editors while a portrait upload is in flight. */
export function InlineBusy({ show }) {
  if (!show) return null;
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" aria-label="Uploading" />;
}
