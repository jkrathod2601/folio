import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-black",
  {
    variants: {
      variant: {
        default: "border border-zinc-200 bg-zinc-100 text-zinc-950",
        solid: "bg-black text-white font-semibold uppercase tracking-wider",
        secondary: "border border-zinc-300 bg-white text-zinc-950",
        tertiary: "border border-zinc-200 bg-white text-zinc-600",
        destructive: "bg-zinc-950 text-white",
        outline: "border border-zinc-300 text-zinc-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
