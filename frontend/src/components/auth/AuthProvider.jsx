import { useEffect, useState } from "react";
import { bootstrapAuth } from "@/lib/api";
import { useMe } from "@/hooks/useAuth";

/**
 * Redeems the httpOnly refresh cookie for an access token before the app renders
 * anything that depends on being signed in.
 *
 * Without this the store is "loading" on every reload and any guard would treat
 * a signed-in reader as anonymous and bounce them to /login.
 *
 * `useMe` is mounted here rather than per-page so there is exactly one
 * `/auth/me` request for the whole app, and so a component can read a real user
 * out of the store without having to await a query of its own. It is disabled
 * until the refresh settles, so it cannot fire with a token that is not there.
 *
 * The store is imported from its own module rather than re-exported here — a
 * component file that also exports non-components breaks fast refresh.
 */
export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);

  useMe();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await bootstrapAuth();
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="font-code text-xs uppercase tracking-widest text-zinc-400">
          Loading
        </p>
      </div>
    );
  }

  return children;
}
