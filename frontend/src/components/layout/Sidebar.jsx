import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
  LogOut,
  X,
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
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useLogout } from "@/hooks/useAuth";

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

/**
 * One nav list, rendered two ways.
 *
 * The rail (desktop) and the drawer (phone) show the same destinations in the
 * same order, so the markup lives here once. Collapsing to icons and opening a
 * full-width drawer are the same decision made at two sizes — a second copy of
 * this list would drift from the first the moment an item is added, and the
 * admin entry below is exactly the kind of thing that gets missed.
 */
function SidebarNav({ collapsed, onNavigate }) {
  const location = useLocation();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const items = isAdmin ? [...navItems, ADMIN_ITEM] : navItems;

  return (
    <nav id="folio-sidebar-nav" aria-label="Main" className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          location.pathname === item.path ||
          (item.path === "/library" && location.pathname.startsWith("/book"));

        const link = (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
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
            <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-white" : "text-zinc-400"
                )}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {!collapsed && (
                <span className={cn("font-body text-sm", isActive && "font-semibold")}>
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

        // Tooltips exist to name an icon. The drawer shows every label, and a
        // tooltip firing on tap over a full-width row is worse than nothing.
        if (!collapsed) return link;

        return (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function Wordmark({ collapsed }) {
  return (
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
  );
}

/**
 * The write actions and the streak card.
 *
 * `collapsed` is the rail state, not the drawer state: the drawer is always
 * expanded, so a phone gets the labelled buttons rather than two mystery icons
 * in a 256px panel.
 */
function SidebarFooter({ collapsed, onNavigate }) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
      <div className="flex flex-col gap-2">
        <Link
          to="/write"
          onClick={onNavigate}
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
          onClick={onNavigate}
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
          collapsed ? "justify-center p-2.5" : "justify-between p-3"
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
  );
}

const Sidebar = () => {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);
  const isDesktop = useIsDesktop();

  /**
   * Called unconditionally, and used below `lg` only.
   *
   * The header owns sign-out on desktop and the drawer owns it on mobile, so
   * the hook is called whichever breakpoint is active — a conditional hook
   * would give React a different hook order per breakpoint, which it cannot
   * reconcile.
   */
  const { mutate: logout, isPending } = useLogout();

  /**
   * The collapse toggle is a rail preference, so it must not apply to a phone.
   *
   * `rail` is the single value every class below branches on. Without it, a
   * desktop-collapsed preference persisted to localStorage would render the
   * phone drawer as 68px of icons — the exact bug this whole change is fixing,
   * just arriving from a different direction.
   */
  const rail = isDesktop && collapsed;

  // A tap that navigates should not leave the drawer covering the page it
  // just went to. Links also fire onNavigate, but this catches the routes
  // reached without one (back/forward, a redirect, the auth callback).
  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  return (
    <>
      {/* Scrim. Below lg only, and only while the drawer is open. */}
      <div
        onClick={closeMobileNav}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out motion-reduce:transition-none lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        id="folio-sidebar"
        /* Hidden from assistive tech and from tab order while closed on a
           phone: a translated-off-screen panel is still focusable, so a
           keyboard user on a narrow window could tab into a drawer they never
           opened. `inert` is the honest signal; `aria-hidden` alone would
           leave the links in the tab order. */
        inert={!isDesktop && !mobileNavOpen ? "" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-zinc-200 bg-white",
          "transition-transform duration-300 ease-out motion-reduce:transition-none",
          // Phone: off-canvas. Desktop: always in, translate pinned to 0 below.
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          rail ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          rail ? SIDEBAR_PADDING_COLLAPSED : SIDEBAR_PADDING
        )}
      >
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto overscroll-contain">
          {/* Wordmark + rail toggle. The toggle stacks when the rail is narrow
              so it never gets pushed off the edge; on a phone the drawer's own
              close button takes that role instead. */}
          <div
            className={cn(
              "flex items-center",
              rail ? "flex-col gap-3" : "justify-between gap-2"
            )}
          >
            <Wordmark collapsed={rail} />

            {isDesktop ? (
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
            ) : (
              <button
                type="button"
                onClick={closeMobileNav}
                aria-label="Close menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <SidebarNav collapsed={rail} onNavigate={closeMobileNav} />
        </div>

        <div className="flex flex-col gap-3">
          <SidebarFooter collapsed={rail} onNavigate={closeMobileNav} />

          {/* Sign out lives in the drawer on a phone. The header keeps its own
              copy behind `sm:`, where there is room for the label — one
              control per breakpoint rather than two fighting for the same
              390px. */}
          {!isDesktop && (
            <button
              type="button"
              onClick={() => logout()}
              disabled={isPending}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-200 px-3.5 py-2.5 font-body text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black disabled:opacity-60"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 text-zinc-400" />
              {isPending ? "Signing out…" : "Sign out"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export { Sidebar };
