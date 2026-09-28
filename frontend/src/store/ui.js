import { create } from "zustand";

const STORAGE_KEY = "folio:sidebar-collapsed";

/**
 * Sidebar widths, as full class strings.
 *
 * These live in one place because three separate components have to agree on
 * them: the sidebar sets its own width, the layout offsets the page content,
 * and the header offsets itself. Hardcoding `w-64` in each is how you end up
 * with a 1px gap after someone changes the collapsed width.
 *
 * These are deliberately literal strings rather than built from a number.
 * Tailwind scans source text for class names, so `left-[${n}px]` produces no
 * CSS at all — the arbitrary value has to appear verbatim in a file. If you
 * change the collapsed width, change it in every string below together.
 */
export const SIDEBAR_WIDTH = "w-64";
export const SIDEBAR_WIDTH_COLLAPSED = "w-[68px]";
export const SIDEBAR_PADDING_COLLAPSED = "p-3";
export const SIDEBAR_PADDING = "p-5";

/**
 * Shell UI state that has to be shared across the sidebar, the layout and the
 * header, but is not server state — so it does not belong in the auth store or
 * in a TanStack Query cache.
 *
 * Persisted by hand rather than with zustand's `persist` middleware, matching
 * `lib/theme.jsx`, which reads localStorage on init and writes on change.
 */
export const useUiStore = create((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: Boolean(collapsed) }),
}));

// Hydrate once at module load so the very first paint is already the right
// width. Doing it in an effect would flash a full-width sidebar and then snap.
if (typeof window !== "undefined") {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      useUiStore.setState({ sidebarCollapsed: true });
    }
  } catch {
    // Private browsing / disabled storage: fall back to expanded and carry on.
  }

  useUiStore.subscribe((state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(state.sidebarCollapsed));
    } catch {
      // Nothing useful to do; the sidebar still works for this session.
    }
  });
}

/** The padding class the layout must apply so content clears the sidebar. */
export const sidebarOffset = (collapsed) => (collapsed ? "pl-[68px]" : "pl-64");

/** The `left-*` class the fixed header must use to clear the sidebar. */
export const headerOffset = (collapsed) => (collapsed ? "left-[68px]" : "left-64");
