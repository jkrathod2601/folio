import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 font-body text-sm leading-relaxed text-zinc-950 transition-colors placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
