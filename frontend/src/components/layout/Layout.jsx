import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiStore, sidebarOffset } from "@/store/ui";

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
  const key = Object.keys(CANVASES).find((route) => pathname.startsWith(route));
  const canvas = key ? CANVASES[key] : DEFAULT_CANVAS;

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
          <main className="min-h-screen w-full bg-zinc-50 pt-16">
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
