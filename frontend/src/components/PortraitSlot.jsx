import { useEffect, useRef, useState } from "react";
import { ImageUp, Trash2, User } from "lucide-react";
import {
  useEntityPortrait,
  useUploadPortrait,
  useDeletePortrait,
} from "@/hooks/useStoryEntities";
import { cn } from "@/lib/utils";

/**
 * Character portrait, capped at 512 KB.
 *
 * Two modes, because the book form runs in both and the id situation differs:
 *
 *   edit   — the character already exists, so the file goes straight to
 *            `PUT .../portrait` and the server owns it immediately.
 *   create — there is no book and no character id yet, so the `File` is held in
 *            form state and uploaded by the form *after* the book is created.
 *            Sending it now is impossible, and base64-in-JSON is exactly the
 *            33% inflation the cover pipeline avoids.
 *
 * The preview is the same in both: a local object URL for a pending File, the
 * fetched blob for a saved one, and a monogram when there is neither.
 */
const MAX_BYTES = 512 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export function PortraitSlot({
  bookId,
  entityId,
  name,
  file,
  onFileChange,
  onUploaded,
  disabled,
}) {
  const inputRef = useRef(null);
  const [problem, setProblem] = useState(null);
  const [localUrl, setLocalUrl] = useState(null);

  const saved = Boolean(entityId && bookId);
  const { url: savedUrl } = useEntityPortrait(bookId, "characters", entityId, saved && !file);
  const upload = useUploadPortrait(bookId, "characters");
  const remove = useDeletePortrait(bookId, "characters");
  const busy = upload.isPending || remove.isPending;

  // Object URL for a File chosen but not yet uploaded. Revoked when the File is
  // replaced or the slot unmounts, or it pins the blob for the life of the
  // document.
  useEffect(() => {
    if (!file) {
      setLocalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = localUrl ?? savedUrl;

  const pick = async (chosen) => {
    setProblem(null);
    if (!chosen) return;
    if (chosen.size > MAX_BYTES) {
      setProblem(`Portraits are capped at ${Math.round(MAX_BYTES / 1024)} KB`);
      return;
    }
    if (!ACCEPT.split(",").includes(chosen.type)) {
      setProblem("PNG, JPEG, WebP or GIF");
      return;
    }

    onFileChange(chosen);

    if (saved) {
      try {
        await upload.mutateAsync({ entityId, file: chosen });
        onUploaded?.();
      } catch (err) {
        setProblem(err.message);
      }
    }
  };

  const clear = async () => {
    onFileChange(null);
    setProblem(null);
    if (saved) {
      try {
        await remove.mutateAsync(entityId);
        onUploaded?.();
      } catch (err) {
        setProblem(err.message);
      }
    }
  };

  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-heading text-xl text-zinc-400">
            {initial}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 font-code text-[11px] uppercase tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          >
            <ImageUp className="h-3.5 w-3.5" />
            {src ? "Replace" : "Add portrait"}
          </button>

          {src && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled || busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 font-code text-[11px] uppercase tracking-wider text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}

          {!saved && file && (
            <span className="font-code text-[10px] uppercase tracking-wider text-zinc-500">
              uploads when you save
            </span>
          )}
        </div>

        {problem && <p className="mt-1 font-code text-[11px] text-zinc-700">{problem}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className={cn("hidden")}
        aria-label={`Portrait for ${name || "character"}`}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          // Reset so choosing the same file twice still fires a change event.
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Empty-state glyph used where a portrait slot has no character yet. */
export function PortraitPlaceholder() {
  return <User className="h-4 w-4 text-zinc-400" aria-hidden="true" />;
}
