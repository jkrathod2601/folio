import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

/**
 * Gate for routes that need a signed-in writer.
 *
 * The provider has already attempted a silent refresh, so `status` is settled by
 * the time this renders — there is no loading branch to get wrong here.
 */
export function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status !== "authenticated") {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

/**
 * The inverse, for pages that only make sense when signed out. Sending an
 * already-authenticated reader to /login is the sort of thing that produces a
 * support ticket about "the login button does nothing".
 */
export function RedirectIfAuthed({ children }) {
  const status = useAuthStore((s) => s.status);
  if (status === "authenticated") return <Navigate to="/" replace />;
  return children;
}

/**
 * Gate for admin-only routes.
 *
 * This is a convenience, not the security boundary — the server rejects a
 * reader with a 403 from the route's auth scope regardless of what the client
 * renders. It exists so a reader who types /admin gets a clean redirect instead
 * of an empty page with a 403 in the console.
 *
 * Reads the role from the store rather than calling /auth/me, so it cannot
 * flash a redirect while the profile is still loading on a hard refresh.
 */
export function RequireAdmin({ children }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  // Signed in but the profile has not landed yet. Rendering nothing beats
  // redirecting to "/" here, which would bounce a real admin out of the page
  // they just opened and then have to click back in.
  if (!user) return null;

  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
