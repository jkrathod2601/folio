import { Link } from "react-router-dom";

/**
 * Catch-all for unknown paths.
 *
 * Rendered inside the guarded route group, so an anonymous reader hitting a
 * typo'd URL is sent to sign in first rather than being told the page does not
 * exist — which would leak the fact that some paths are real and some are not.
 */
function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-code text-xs uppercase tracking-widest text-zinc-400">
        Nothing here
      </p>
      <h1 className="mt-3 font-heading text-3xl text-zinc-950">
        That page does not exist
      </h1>
      <p className="mt-2 max-w-sm font-body text-sm text-zinc-600">
        The link may be old, or the page may have been renamed.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-black px-4 py-2 font-code text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
      >
        Back to the feed
      </Link>
    </div>
  );
}

export { NotFound };
