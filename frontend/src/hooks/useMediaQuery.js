import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query and re-renders on change.
 *
 * This exists for the shell, which has to make a *structural* choice on
 * breakpoint rather than a cosmetic one: a narrow rail with a single-letter
 * wordmark and a full-width off-canvas drawer are different components wearing
 * the same clothes, and no amount of `lg:`/`hidden:` utility can swap which
 * JSX renders. It also keeps the tooltips off touch, where they fire on tap and
 * sit on top of the drawer instead of beside a rail.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect` because the
 * media query *is* an external store, and the usual hand-rolled version has to
 * call `setState` inside its subscribe effect to re-sync when `query` changes.
 * That is a second render pass on mount and a cascading-render warning. This
 * form reads the current value during render and React guarantees the snapshot
 * is consistent, so there is no effect and no extra pass.
 *
 * `getServerSnapshot` returns `false` for symmetry with the render function.
 * Nothing can reach it — this app is a Vite SPA with no server render.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * The breakpoint where the sidebar becomes a fixed rail.
 *
 * Duplicated as a literal in every `lg:` utility across the shell on purpose —
 * Tailwind scans source text for class names, so a shared `min-[1024px]:`
 * variable would emit no CSS at all. Change 1024 here and in the `lg:`
 * utilities together.
 */
export const DESKTOP_QUERY = "(min-width: 1024px)";

export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY);
