import { Link, useLocation } from "react-router-dom";
import { AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/api";
import { useAuthConfig } from "@/hooks/useAuth";
import { CONTACT_EMAIL } from "@/pages/PrivacyPage";

// Google's brand mark. Recoloured to monochrome to match the rest of the app —
// which is also why this is inline rather than loaded as Google's asset.
function GoogleMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.59-5.17 3.59-8.81Z" />
      <path d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
      <path d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z" />
      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function LoginPage() {
  const location = useLocation();
  const { data: config, isPending } = useAuthConfig();

  // Google sends the user back here with ?error=... when consent is declined.
  const params = new URLSearchParams(location.search);
  const error = params.get("error");

  const googleReady = config?.googleEnabled;

  const handleSignIn = () => {
    const from = location.state?.from?.pathname;
    // Remembered so the callback can return the reader to where they were.
    if (from && from !== "/login") sessionStorage.setItem("folio:auth:returnTo", from);
    signInWithGoogle();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <BookOpen className="h-5 w-5 text-zinc-950" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-wide text-zinc-950">
            Folio
          </h1>
          <p className="mt-1 font-code text-xs uppercase tracking-widest text-zinc-500">
            One page at a time
          </p>
        </div>

        <Card className="p-6">
          <h2 className="font-heading text-xl font-semibold tracking-wide text-zinc-950">
            Sign in
          </h2>
          <p className="mt-1 font-body text-sm text-zinc-600">
            Your manuscripts, annotations and circles live in your account.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-950" />
              <p className="font-body text-xs text-zinc-700">
                {error === "access_denied"
                  ? "Sign-in was cancelled. Nothing was changed."
                  : "Sign-in could not be completed. Please try again."}
              </p>
            </div>
          )}

          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={handleSignIn}
            disabled={isPending || googleReady === false}
          >
            <GoogleMark className="h-4 w-4" />
            <span>Continue with Google</span>
          </Button>

          {googleReady === false && !isPending && (
            <p className="mt-3 font-code text-xs text-zinc-500">
              Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID,
              GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.
            </p>
          )}

          <p className="mt-5 border-t border-zinc-100 pt-4 font-body text-xs text-zinc-500">
            Folio only ever reads your name, email and profile photo from Google.
            We never post to your account.
          </p>
        </Card>

        <p className="mt-6 text-center font-body text-sm text-zinc-500">
          <Link to="/" className="transition-colors hover:text-black">
            ← Browse without signing in
          </Link>
        </p>

        {/* Google's OAuth brand review reads the sign-in page as the public face
            of the app and requires both legal documents to be reachable from it,
            not just from the home feed. */}
        <nav
          aria-label="Legal"
          className="mt-4 flex items-center justify-center gap-x-4 gap-y-1 text-center font-body text-xs text-zinc-500"
        >
          <Link to="/privacy" className="transition-colors hover:text-black">
            Privacy Policy
          </Link>
          <span aria-hidden="true">•</span>
          <Link to="/terms" className="transition-colors hover:text-black">
            Terms of Service
          </Link>
          <span aria-hidden="true">•</span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="transition-colors hover:text-black"
          >
            Contact
          </a>
        </nav>
      </div>
    </div>
  );
}

export { LoginPage };
