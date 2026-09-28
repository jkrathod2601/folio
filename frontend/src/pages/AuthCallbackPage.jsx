import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

/**
 * Reads the redirect fragment exactly once.
 *
 * The backend puts the access token in the URL *fragment* — never the path or
 * query, so it is not sent to any server and does not land in an access log. It
 * still has to be scrubbed from the address bar, because anything that can read
 * `location.href` (an analytics snippet, a browser extension, a Referer header on
 * the next navigation) can read the token for as long as it sits there.
 *
 * The result is captured with a lazy useState initializer rather than a ref: the
 * fragment is consumed on the first render and there is nothing to re-derive it
 * from, so state is the right owner and it runs the read exactly once. Writing it
 * to state inside an effect would be a second render for a value already known.
 */
function readRedirect() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const failure = hash.get("error");
  const accessToken = hash.get("access_token");

  window.history.replaceState(null, "", window.location.pathname);

  if (failure) {
    return {
      error:
        failure === "access_denied"
          ? "Sign-in was cancelled."
          : `Sign-in failed: ${failure}`,
    };
  }

  if (!accessToken) {
    return { error: "Google did not return a sign-in token. Please try again." };
  }

  return { accessToken };
}

/** Landing point for the Google redirect. */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [redirect] = useState(readRedirect);

  const { accessToken, error } = redirect;

  useEffect(() => {
    if (error) return;

    // Keep whatever user the store already holds. On a real sign-in AuthProvider
    // redeemed the refresh cookie on the way in and /auth/refresh returns the
    // whole profile, so this is usually already populated — blanking it here
    // would be a downgrade. It is genuinely null only on a cold callback with no
    // cookie, and the mounted useMe query covers that case.
    useAuthStore.getState().setSession({ accessToken, user: useAuthStore.getState().user });

    const returnTo = sessionStorage.getItem("folio:auth:returnTo");
    sessionStorage.removeItem("folio:auth:returnTo");
    navigate(returnTo || "/", { replace: true });
  }, [accessToken, error, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
              <AlertCircle className="h-5 w-5 text-zinc-950" />
            </div>
            <p className="font-body text-sm text-zinc-700">{error}</p>
            <Button className="mt-5" onClick={() => navigate("/login", { replace: true })}>
              Back to sign in
            </Button>
          </>
        ) : (
          <p className="font-code text-xs uppercase tracking-widest text-zinc-400">
            Finishing sign-in
          </p>
        )}
      </div>
    </div>
  );
}

export { AuthCallbackPage };
