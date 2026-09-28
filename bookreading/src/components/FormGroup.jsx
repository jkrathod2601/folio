import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formLabel } from "@/components/Field";

/**
 * A collapsible form group.
 *
 * The book form is about to carry thirty-odd optional fields. Rendering them all
 * expanded buries the four that actually matter — title, blurb, cover, save —
 * under a wall of empty inputs, and an author opening "new book" to type a
 * title should not have to scroll past character cards to reach the submit
 * button.
 *
 * Collapsed by default, and open if it holds an error, so a field the server
 * rejected is never hidden behind a disclosure the author has to guess about.
 */
export function FormGroup({ title, hint, children, defaultOpen = false, count, id }) {
  // `useState` only reads its argument on the first render, so seeding the form
  // with `setCharacters(...)` after the book and its three entity queries land
  // arrives too late to matter: the group was already initialised closed and a
  // group holding a full cast stayed hidden. Keying the state on `count` remounts
  // the group the moment it gains content, which is what "open if it holds
  // something" is supposed to mean. The author has not typed into a group that
  // was empty a moment ago, so nothing is discarded by the remount.
  const [open, setOpen] = useState(defaultOpen || Boolean(count));
  const [touched, setTouched] = useState(false);
  const shown = open || (Boolean(count) && !touched);

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white">
      <legend className="sr-only">{title}</legend>

      <button
        type="button"
        onClick={() => {
          setTouched(true);
          setOpen((o) => !o);
        }}
        aria-expanded={shown}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0">
          <span className="block font-code text-[11px] uppercase tracking-widest text-zinc-700">
            {title}
            {count > 0 && (
              <span className="ml-2 rounded-full bg-zinc-950 px-1.5 py-0.5 text-[10px] text-white">
                {count}
              </span>
            )}
          </span>
          {hint && (
            <span className="mt-0.5 block font-body text-xs leading-relaxed text-zinc-500">
              {hint}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            shown && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div id={id} className="space-y-5 border-t border-zinc-200 px-4 py-4">
          {children}
        </div>
      )}
    </fieldset>
  );
}

/** A labelled subsection inside a `FormGroup`. */
export function SubGroup({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div>
        <p className={formLabel}>{title}</p>
        {hint && <p className="-mt-1 font-body text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
