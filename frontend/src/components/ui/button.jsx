import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-body transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white shadow-sm hover:bg-zinc-800 active:scale-95 font-body text-xs font-bold uppercase tracking-wider",
        outline:
          "border border-zinc-300 bg-white text-zinc-950 hover:border-black hover:bg-zinc-100 font-body text-xs font-bold uppercase tracking-wider",
        inverted:
          "border border-black bg-white text-zinc-950 hover:bg-black hover:text-white transition-all font-body text-xs font-bold uppercase tracking-wider",
        destructive:
          "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 active:scale-95 font-body text-xs font-bold uppercase tracking-wider",
        secondary:
          "border border-zinc-200 bg-zinc-100 text-zinc-950 hover:bg-black hover:text-white transition-all font-body text-xs font-bold uppercase tracking-wider",
        soft: "bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        link: "text-zinc-950 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-1.5",
        lg: "px-5 py-2.5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

// asChild merges the button's classes onto whatever single element is passed
// as a child (usually a react-router <Link>), instead of wrapping it in a
// second <a> and producing invalid nested-anchor markup.
function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
