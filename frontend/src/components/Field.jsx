export const formLabel =
  "mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600";

export const formField =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-body text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-500";

/** A labelled form control. `label` is the visible text, `htmlFor` the input id. */
function Field({ id, label: text, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={formLabel}>
        {text}
        {hint && (
          <span className="normal-case tracking-normal text-zinc-500"> {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

export { Field };
