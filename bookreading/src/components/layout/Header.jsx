import { useLocation, Link } from "react-router-dom";
import { Search, Bell, Plus, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useUiStore, headerOffset } from "@/store/ui";
import { useLogout } from "@/hooks/useAuth";

const bookNames = {
  "1": "Zindagi Ke Kuch Panne",
  "2": "My Little Life",
  "3": "Travel Diaries",
  "4": "College Memories",
  "5": "Daily Gratitude",
};

const pageNames = {
  "1": "Pehla Pan",
  "2": "Yaadein",
  "3": "Subah Ki Chai",
  "4": "Dosti",
  "5": "Raat Ki Baatein",
};

const pageTitles = {
  "/discover": "Discover",
  "/library": "Bookshelf",
  "/circles": "Writing Circles",
  "/notifications": "Notifications",
  "/profile": "Profile",
  "/settings": "Settings",
  "/write": "Create Page",
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [{ label: "Feed", path: "/" }];

  if (segments[0] === "book" && segments[1]) {
    crumbs.push({ label: bookNames[segments[1]] || "Book", path: `/book/${segments[1]}` });
  } else if (segments[0] === "page" && segments[1]) {
    const bookId = "1";
    crumbs.push({ label: bookNames[bookId] || "Book", path: `/book/${bookId}` });
    crumbs.push({ label: pageNames[segments[1]] || "Page", path: `/page/${segments[1]}` });
  } else {
    crumbs.push({ label: pageTitles[`/${segments[0]}`] || segments[0], path: location.pathname });
  }

  return (
    <nav className="flex items-center gap-1 overflow-x-auto font-body text-sm text-zinc-600">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1 whitespace-nowrap">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
          {i === crumbs.length - 1 ? (
            <span className="font-semibold text-zinc-950">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="transition-colors hover:text-black">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function SearchField() {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
      <Input
        placeholder="Search stories, manuscripts, authors..."
        className="h-8 pl-10 pr-20 py-1.5"
      />
      <kbd className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-600">
        ⌘<span>K</span>
      </kbd>
    </div>
  );
}

function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const { mutate: logout, isPending } = useLogout();

  // No signed-out branch here. The header only renders inside the guarded
  // layout, so an anonymous reader never reaches this component — sign-in lives
  // on /login. Keeping a "Sign in" link would be unreachable dead markup.
  if (status !== "authenticated") return null;

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  // No mock fallback here. /auth/me may not have resolved on the first paint
  // after a Google callback, and the old fallback filled that gap with Jay's
  // seeded portrait — which showed one user's face to every other signed-in
  // account. The AvatarFallback below covers the same gap honestly, and the
  // store is populated before any guarded route renders anyway.
  const portrait = user?.portraitUrl ?? null;

  return (
    <div className="flex items-center gap-3 border-l border-zinc-200 pl-4">
      <Link
        to="/profile"
        aria-label={user?.name ? `Open ${user.name}'s profile` : "Open your profile"}
        className="transition-opacity hover:opacity-80"
      >
        <Avatar className="h-8 w-8 grayscale ring-1 ring-zinc-300">
          {portrait && <img src={portrait} alt="" className="h-full w-full object-cover" />}
          <AvatarFallback className="font-body text-xs">{initial}</AvatarFallback>
        </Avatar>
      </Link>

      <Button variant="ghost" size="sm" onClick={() => logout()} disabled={isPending}>
        {isPending ? "Leaving" : "Sign out"}
      </Button>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const isSubPage = location.pathname !== "/";
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <header
      className={`fixed right-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-8 backdrop-blur-md transition-[left] duration-300 ease-out motion-reduce:transition-none ${headerOffset(collapsed)}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {isSubPage ? (
          <Breadcrumbs />
        ) : (
          <div className="w-full max-w-xl">
            <SearchField />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <Link
          to="/write"
          className="hidden items-center gap-1.5 rounded-lg border border-black bg-white px-4 py-1.5 font-body text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-black hover:text-white sm:flex"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Draft Excerpt</span>
        </Link>

        <Link
          to="/notifications"
          className="relative rounded-full p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-black" />
        </Link>

        {/* The signed-in writer, linking to their own bookshelf. */}
        <AccountMenu />
      </div>
    </header>
  );
}

export { Header };
