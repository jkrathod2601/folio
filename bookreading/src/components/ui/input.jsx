import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 font-body text-sm text-zinc-950 transition-colors file:border-0 file:bg-transparent file:font-body file:text-sm file:font-medium file:text-zinc-950 placeholder:text-zinc-400 hover:bg-zinc-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
