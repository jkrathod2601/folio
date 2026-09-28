import { useRef, useState } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { useUploadCover, useDeleteCover } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";

/**
 * Cover image upload, capped at 1 MB.
 *
 * The file is sent as the raw request body rather than base64 inside a JSON
 * payload, so the server's 1 MB `maxBytes` is literally the wire limit instead
 * of a 1.4 MB one. It also means no 33% inflation on every upload.
 *
 * The size is checked here *and* on the server. The browser check is a courtesy
 * that saves a doomed round-trip; the server check is the one that enforces it.
 */
const MAX_BYTES = 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

const formatSize = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;

/**
 * `coverUrl` is passed in rather than fetched here, so the form holds one
 * subscription to the cover query instead of two. It is also what the main
 * preview renders, which means this thumbnail and the preview are guaranteed to
 * be the same image at the same moment.
 */
export function CoverImageUpload({ bookId, hasCover, coverUrl, onChange, disabled }) {
  const inputRef = useRef(null);
  const upload = useUploadCover();
  const remove = useDeleteCover();
  const [problem, setProblem] = useState(null);

  const busy = upload.isPending || remove.isPending;

  const pick = async (file) => {
    setProblem(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProblem("That is not an image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      // Said here so a 4 MB phone photo does not have to travel to learn so.
      setProblem(`${formatSize(file.size)} is over the 1 MB limit.`);
      return;
    }

    try {
      await upload.mutateAsync({ id: bookId, file });
      onChange?.(true);
    } catch (e) {
      setProblem(e.message);
    }
  };

  const clear = async () => {
    setProblem(null);
    try {
      await remove.mutateAsync(bookId);
      onChange?.(false);
    } catch (e) {
      setProblem(e.message);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block font-code text-[11px] uppercase tracking-widest text-zinc-600">
        Cover image
      </span>

      <div className="flex items-start gap-4">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden border border-zinc-200 bg-zinc-100">
          {hasCover && coverUrl ? (
            <img src={coverUrl} alt="Current cover" className="h-full w-full object-cover" />
          ) : hasCover ? (
            <span className="flex h-full w-full items-center justify-center font-code text-[10px] uppercase tracking-wider text-zinc-400">
              Loading
            </span>
          ) : (
            <span className="flex h-full w-full items-center justify-center font-code text-[10px] uppercase tracking-wider text-zinc-400">
              Design
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-700" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-body text-xs leading-relaxed text-zinc-600">
            {hasCover
              ? "Artwork sits behind the title — the preview on the left shows exactly how it composes."
              : "No image yet, so the cover you design below is all readers see. Add one to put artwork behind the title."}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 font-code text-[10px] uppercase tracking-wider text-zinc-700 transition-colors",
                "hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
              )}
            >
              <ImageUp className="h-3.5 w-3.5" aria-hidden="true" />
              {hasCover ? "Replace image" : "Upload image"}
            </button>

            {hasCover && (
              <button
                type="button"
                disabled={disabled || busy}
                onClick={clear}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 font-code text-[10px] uppercase tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>

          <p className="mt-2 font-code text-[10px] text-zinc-500">
            PNG, JPEG, WebP or GIF · max 1 MB
          </p>

          {problem && (
            <p role="alert" className="mt-2 font-code text-[11px] text-zinc-700">
              {problem}
            </p>
          )}
        </div>
      </div>

      {/* Kept out of the flow: a visible file input cannot be styled to match
          the rest of the form, and a label-over-input pattern would fight the
          button's own affordance. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          // Reset so re-picking the same file fires change again.
          e.target.value = "";
        }}
      />
    </div>
  );
}
