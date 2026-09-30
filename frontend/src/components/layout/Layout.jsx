import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiStore, sidebarOffset } from "@/store/ui";
import { useIsDesktop } from "@/hooks/useMediaQuery";

// Per-route canvases. Discover is a wider editorial grid; the write studio is
// widest and renders its own padding so its action ribbon can be full-bleed.
const CANVASES = {
  "/discover": "mx-auto w-full max-w-[1400px] px-8 py-8",
  "/write": "mx-auto w-full max-w-[1600px] px-0 py-0",
};
const DEFAULT_CANVAS = "mx-auto w-full max-w-[1240px] px-6 py-8";

const Layout = () => {
  const { pathname } = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUiStore((s) => s.closeMobileNav);
  const isDesktop = useIsDesktop();
  const key = Object.keys(CANVASES).find((route) => pathname.startsWith(route));
  const canvas = key ? CANVASES[key] : DEFAULT_CANVAS;

  // Escape closes the drawer, the convention for any modal-ish surface. Only
  // while it is open and only below lg, so it does not swallow the key on
  // desktop where there is no drawer to dismiss.
  useEffect(() => {
    if (isDesktop || !mobileNavOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, mobileNavOpen, closeMobileNav]);

  /**
   * Hold the page still behind the drawer.
   *
   * Not optional polish: the drawer covers 256px of a 390px screen, so a
   * scrolling page drags under a static panel and the links slide around
   * behind it. `paddingRight` compensates for the removed scrollbar so the
   * layout does not jump sideways as it locks — the same jump you get on
   * desktop when a Radix dialog opens, and the reason the compensation is
   * measured rather than assumed.
   */
  useEffect(() => {
    if (isDesktop || !mobileNavOpen) return;

    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [isDesktop, mobileNavOpen]);

  // Cmd/Ctrl+B, the conventional shortcut. Skipped while the reader is typing,
  // where the browser binds the same chord to bold and hijacking it would be
  // actively hostile.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "b") return;

      const el = document.activeElement;
      const typing =
        el?.isContentEditable ||
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.tagName === "SELECT";
      if (typing) return;

      e.preventDefault();
      toggleSidebar();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50">
        <Sidebar />
        <div
          className={`transition-[padding] duration-300 ease-out motion-reduce:transition-none ${sidebarOffset(collapsed)}`}
        >
          <Header />

          {/*
            min-h-[100dvh], not min-h-screen: this column already carries pt-16
            to clear the fixed header, so a viewport-height floor made every
            page 64px taller than the screen and a short page scrolled for
            exactly one header's worth. dvh rather than vh so mobile browser
            chrome retracting does not leave the last row under the URL bar.
          */}
          <main className="min-h-[100dvh] w-full bg-zinc-50 pt-16">
            <div className={canvas}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export { Layout };
