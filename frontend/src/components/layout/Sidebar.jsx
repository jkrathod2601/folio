import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  BookPlus,
  Compass,
  Library,
  Users,
  Bell,
  Settings,
  Flame,
  TrendingUp,
  PenLine,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useUiStore,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_PADDING,
  SIDEBAR_PADDING_COLLAPSED,
} from "@/store/ui";
import { useAuthStore } from "@/store/auth";

const navItems = [
  { path: "/", label: "Feed", icon: BookOpen },
  { path: "/discover", label: "Discover & Genres", icon: Compass },
  { path: "/library", label: "Bookshelf", icon: Library },
  { path: "/circles", label: "Writing Circles", icon: Users },
  { path: "/profile", label: "Your Profile", icon: UserRound },
  { path: "/notifications", label: "Notifications", icon: Bell, dot: true },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Kept out of `navItems` because it is role-gated: the list is static, this is
// not. See the isAdmin filter where it is appended.
const ADMIN_ITEM = { path: "/admin", label: "Administration", icon: ShieldCheck };

const Sidebar = () => {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  // The store is populated from /auth/me on sign-in, so this is correct on the
  // first render of a hard refresh — no role flash for a reader.
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const items = isAdmin ? [...navItems, ADMIN_ITEM] : navItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col justify-between border-r border-zinc-200 bg-white",
        "transition-[width] duration-300 ease-out motion-reduce:transition-none",
        collapsed
          ? cn(SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_PADDING_COLLAPSED)
          : cn(SIDEBAR_WIDTH, SIDEBAR_PADDING)
      )}
    >
      <div className="flex flex-col gap-6">
        {/* Wordmark + collapse toggle. Stacks when collapsed so the toggle never
            gets pushed off the edge of the narrow rail. */}
        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-3" : "justify-between gap-2"
          )}
        >
          <Link
            to="/"
            aria-label="Folio — feed"
            className={cn(
              "group flex animate-fade-in items-center motion-reduce:animate-none",
              collapsed ? "justify-center" : "gap-2.5 px-1 py-1"
            )}
          >
            {collapsed ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black font-brand text-base uppercase text-white">
                F
              </span>
            ) : (
              <span className="flex flex-col">
                <span className="relative font-brand text-lg uppercase tracking-widest text-black transition-[letter-spacing] duration-300 ease-out group-hover:tracking-[0.2em] motion-reduce:transition-none">
                  Folio
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-black transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                  />
                </span>
                <span className="font-mono text-label-xs uppercase tracking-[0.18em] text-zinc-500">
                  One page at a time
                </span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-controls="folio-sidebar-nav"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          id="folio-sidebar-nav"
          aria-label="Main"
          className="flex flex-col gap-1.5"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/library" && location.pathname.startsWith("/book"));

            const link = (
              <Link
                key={item.path}
                to={item.path}
                aria-label={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center rounded-lg transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "justify-between px-3.5 py-2.5",
                  isActive
                    ? "bg-black font-medium text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
                )}
              >
                <div
                  className={cn(
                    "flex items-center",
                    collapsed ? "justify-center" : "gap-3"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-white" : "text-zinc-400"
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  {!collapsed && (
                    <span
                      className={cn("font-body text-sm", isActive && "font-semibold")}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                {/* The unread dot stays meaningful when collapsed: it moves onto
                    the item's corner rather than disappearing with the label. */}
                {item.dot &&
                  (collapsed ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-black"
                    />
                  ) : (
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-black" />
                  ))}
              </Link>
            );

            if (!collapsed) return link;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
        <div className="flex flex-col gap-2">
          <Link
            to="/write"
            aria-label="Start Writing"
            title="Start Writing"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg bg-black text-white shadow-sm transition-colors hover:bg-zinc-800",
              collapsed ? "h-10 w-10" : "w-full px-4 py-2.5"
            )}
          >
            <PenLine className="h-4 w-4" />
            {!collapsed && (
              <span className="font-body text-sm font-semibold tracking-wide">
                Start Writing
              </span>
            )}
          </Link>
          <Link
            to="/books/new"
            aria-label="New Book"
            title="New Book"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border border-zinc-300 text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 hover:text-black",
              collapsed ? "h-10 w-10" : "w-full px-4 py-2"
            )}
          >
            <BookPlus className="h-4 w-4" />
            {!collapsed && (
              <span className="font-body text-sm font-semibold tracking-wide">
                New Book
              </span>
            )}
          </Link>
        </div>

        {/* Streak card. Collapsed it keeps the flame and the number — the
            number is the point of the widget, so it survives even when the
            words do not. */}
        <div
          className={cn(
            "flex items-center rounded-lg border border-zinc-200 bg-zinc-100",
            collapsed
              ? "justify-center p-2.5"
              : "justify-between p-3"
          )}
        >
          {collapsed ? (
            <>
              <Flame className="h-[18px] w-[18px] text-black" />
              <span className="sr-only">14 day streak, 1,420 words today</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <Flame className="h-[18px] w-[18px] text-black" />
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-semibold uppercase tracking-tight text-black">
                    14 Day Streak
                  </span>
                  <span className="font-code text-[11px] text-zinc-500">
                    1,420 words today
                  </span>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-zinc-400" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export { Sidebar };
