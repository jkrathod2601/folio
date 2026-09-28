import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Role marker for an account.
 *
 * Admin is a filled black chip so it reads as a state rather than a label;
 * reader is an outlined one so a table of fifty rows is not mostly black.
 */
export function AdminBadge({ role, className }) {
  const isAdmin = role === "admin";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider",
        isAdmin ? "bg-black text-white" : "border border-zinc-200 text-zinc-500",
        className
      )}
    >
      {isAdmin && <ShieldCheck className="h-3 w-3" />}
      {role}
    </span>
  );
}
