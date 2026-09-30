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
export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: Boolean(collapsed) }),

  /**
   * Off-canvas drawer, the phone counterpart to the collapse rail.
   *
   * Deliberately NOT persisted. `sidebarCollapsed` is a preference and belongs
   * remembered; an open drawer is a transient state, and reloading into one
   * covering the page you asked to see is a bug, not a convenience.
   */
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
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

/**
 * The padding class the layout must apply so content clears the sidebar.
 *
 * `pl-0` below `lg` is the load-bearing part: on a phone the sidebar is a
 * drawer that sits above the content, so reserving 256px for it would leave
 * 134px of a 390px screen. The rail only exists from `lg` up.
 */
export const sidebarOffset = (collapsed) =>
  collapsed ? "pl-0 lg:pl-[68px]" : "pl-0 lg:pl-64";

/** The `left-*` class the fixed header must use to clear the sidebar. */
export const headerOffset = (collapsed) =>
  collapsed ? "left-0 lg:left-[68px]" : "left-0 lg:left-64";
