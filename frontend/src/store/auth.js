import { create } from "zustand";

/**
 * Auth state.
 *
 * The access token lives in this store and nowhere else — not localStorage, not
 * sessionStorage, not a cookie. A page refresh empties it, and `bootstrap()`
 * trades the httpOnly refresh cookie for a new one on startup. That is the cost
 * of not leaving a bearer token where any injected script can read it.
 */
export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  // "loading" until the silent refresh has been attempted, so protected routes
  // do not bounce a signed-in user to /login on every reload.
  status: "loading", // "loading" | "authenticated" | "anonymous"

  setSession: ({ accessToken, user }) =>
    set({ accessToken, user, status: "authenticated" }),

  setUser: (user) => set({ user }),

  clear: () => set({ accessToken: null, user: null, status: "anonymous" }),

  isAuthenticated: () => Boolean(get().accessToken),
}));
