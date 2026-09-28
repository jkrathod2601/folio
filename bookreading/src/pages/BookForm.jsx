import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Contrast, Feather, Loader2, Save } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api, apiFetch } from "@/lib/api";
import { useBook, useCreateBook, useUpdateBook, useCoverImage } from "@/hooks/useBooks";
import { useStoryEntities, stripLocalFields } from "@/hooks/useStoryEntities";
import { BookCover } from "@/components/BookCover";
import { CoverDesigner } from "@/components/CoverDesigner";
import { GenrePicker } from "@/components/GenrePicker";
import { Field, formLabel as label, formField as field } from "@/components/Field";
import { FormGroup } from "@/components/FormGroup";
import { BookMetadataFields, EMPTY_METADATA, countFilledMetadata } from "@/components/BookMetadataFields";
import { CharacterEditor, PlaceEditor, SectionEditor } from "@/components/StoryEntityEditors";
import { LAYOUTS, DEFAULT_DESIGN, MAX_GENRES, isReadable, contrastRatio } from "@/lib/bookDesign";
import { cn } from "@/lib/utils";


const VISIBILITY = [
  { key: "public", label: "Public", hint: "Listed on Discover" },
  { key: "unlisted", label: "Unlisted", hint: "Reachable by link only" },
  { key: "private", label: "Private", hint: "Only you can open it" },
];

const STATUS = [
  { key: "draft", label: "Draft", hint: "Only you can see it" },
  { key: "published", label: "Published", hint: "Listed on the library" },
  { key: "archived", label: "Archived", hint: "Kept, not listed" },
];

/**
 * Pull just the optional-metadata keys off a book.
 *
 * Keyed off `EMPTY_METADATA` rather than spread whole, so `cover`, `design` and
 * `pageCount` cannot ride along in the metadata object and then get submitted
 * back as form values. Those are server-owned; a form must never be the thing
 * that sets them.
 */
function pickMetadata(book) {
  const out = {};
  for (const key of Object.keys(EMPTY_METADATA)) {
    if (book[key] !== undefined) out[key] = book[key];
  }
  return out;
}

/** `publishedAt` is a Date on the server and a `YYYY-MM-DD` string in a date input. */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

/**
 * Upload portraits the author picked but that could not travel with the save.
 *
 * A portrait is a `File`, and a `File` in a JSON body is either dropped or
 * serialised as `{}` — so it cannot ride along with the create or the patch,
 * and on the create form the characters do not even have server ids yet. So they
 * are uploaded here, as a second pass, once the book and its characters exist.
 *
 * Form rows are matched to saved rows by the client `key` they were minted with.
 * The alternative — matching on array position — breaks the moment a save is
 * reordered, retried, or partially failed.
 *
 * A failed portrait must not fail the save. The book, the cast list and every
 * other field are already committed at this point, and refusing to navigate
 * would leave the author looking at a form whose contents are all persisted.
 * The portrait is simply still missing, which is the one thing they can fix by
 * choosing the file again.
 */
async function uploadPendingPortraits(bookId, characters) {
  const pending = characters.filter((c) => c.portraitFile);
  if (pending.length === 0) return;

  let saved = [];
  try {
    const res = await api.get(`/books/${bookId}/characters`);
    saved = res.characters ?? [];
  } catch {
    return;
  }

  const byKey = new Map(saved.map((c) => [c.key, c]));

  for (const row of pending) {
    const match = byKey.get(row.key);
    if (!match) continue;
    try {
      await apiFetch(`/books/${bookId}/characters/${match.id}/portrait`, {
        method: "PUT",
        body: row.portraitFile,
        raw: true,
        headers: { "content-type": row.portraitFile.type },
      });
    } catch {
      // Deliberately swallowed, per the note above.
    }
  }
}



/**
 * The book form, used by both "new book" and "edit book".
 *
 * `bookId` decides which. Passing one loads the book and saves a PATCH; omitting
 * it creates. Everything else is identical, deliberately: an editor that saves
 * a subset of fields, or validates differently, is how a book ends up quietly
 * losing its subtitle the first time someone edits its cover.
 *
 * Save is explicit. Autosave on every keystroke would PUT a half-typed title and
 * a mid-edit palette as real data, and a "unpublish me" toggle is one stray
 * keystroke away from being an incident.
 */
/**
 * The one screen shown when a book cannot be edited. Extracted so the
 * not-yours and load-failed cases cannot drift apart in wording or in the way
 * they offer an exit.
 */
function Refusal({ heading, body }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl uppercase tracking-wide text-zinc-950">
        {heading}
      </h1>
      <p className="mt-2 font-body text-sm text-zinc-600">{body}</p>
      <Link
        to="/profile"
        className="mt-5 inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to your profile
      </Link>
    </div>
  );
}

export function BookForm({ bookId }) {
  const isEdit = Boolean(bookId);
  const navigate = useNavigate();

  const user = useAuthStore((st) => st.user);
  const existing = useBook(bookId);
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const saving = createBook.isPending || updateBook.isPending;
  const saveError = createBook.error ?? updateBook.error;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [mark, setMark] = useState("");
  const [genres, setGenres] = useState([]);
  const [visibility, setVisibility] = useState("unlisted");
  const [status, setStatus] = useState("draft");
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [hasCover, setHasCover] = useState(false);
  const [touched, setTouched] = useState(false);
  // Optional descriptive metadata. Held as one object so the form has a single
  // value to seed, diff and submit rather than fifteen independent useStates.
  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  // Story bible. Held in component state on the create form because the book
  // does not exist yet; seeded from the API on the edit form.
  const [characters, setCharacters] = useState([]);
  const [places, setPlaces] = useState([]);
  const [sections, setSections] = useState([]);
  // Once a book is loaded the form is no longer a blank slate, so "unsaved"
  // must mean "differs from what was loaded" rather than "every field is empty".
  const [dirty, setDirty] = useState(false);

  // The three collections, read once on the edit form.
  const loadedCharacters = useStoryEntities(isEdit ? bookId : null, "characters");
  const loadedPlaces = useStoryEntities(isEdit ? bookId : null, "places");
  const loadedSections = useStoryEntities(isEdit ? bookId : null, "sections");

  // Seed the form once, when the book first arrives. A ref rather than state
  // because this must not itself trigger a render, and because re-seeding on a
  // background refetch would silently discard whatever the author has typed
  // since.
  const seededFor = useRef(null);
  useEffect(() => {
    const b = existing.data;
    if (!b || seededFor.current === b.id) return;
    seededFor.current = b.id;
    setTitle(b.title ?? "");
    setSubtitle(b.subtitle ?? "");
    setBlurb(b.blurb ?? "");
    setMark(b.mark ?? "");
    setGenres(b.genres ?? []);
    setVisibility(b.visibility ?? "unlisted");
    setStatus(b.status ?? "draft");
    setDesign({ ...DEFAULT_DESIGN, ...(b.design ?? {}) });
    setHasCover(Boolean(b.cover));
    setMetadata({ ...EMPTY_METADATA, ...pickMetadata(b), publishedAt: toDateInput(b.publishedAt) });
  }, [existing.data]);

  // Story-bible entries seed separately from the book, because they arrive from
  // three separate queries and the book is ready long before they are. Guarded
  // on the same book id so a background refetch cannot overwrite typing.
  const seededEntitiesFor = useRef(null);
  useEffect(() => {
    if (!isEdit || seededEntitiesFor.current === bookId) return;
    if (!loadedCharacters.data || !loadedPlaces.data || !loadedSections.data) return;

    seededEntitiesFor.current = bookId;
    setCharacters(loadedCharacters.data ?? []);
    setPlaces(loadedPlaces.data ?? []);
    setSections(loadedSections.data ?? []);
  }, [isEdit, bookId, loadedCharacters.data, loadedPlaces.data, loadedSections.data]);


  // Any edit marks the form dirty, which is what the header's "unsaved changes"
  // note reads.
  const change = (setter) => (value) => {
    setter(value);
    setDirty(true);
  };

  // Fetched once here and handed to both the preview and the upload widget, so
  // the form does not hold two subscriptions to the same query and mint two
  // object URLs for one image.
  const { url: coverUrl } = useCoverImage(isEdit ? bookId : null, hasCover);

  // `book.author.id` and the session user id come from the same place, so this
  // is a string compare of two ObjectIds — not the `.toString()` trap that
  // broke the server's own check.
  const isMine = !isEdit || existing.data?.author?.id === user?.id;

  const trimmedTitle = title.trim();
  const invalid = trimmedTitle.length === 0;
  const contrast = contrastRatio(design.textColor, design.coverColor);
  const readable = isReadable(design.textColor, design.coverColor);

  // The preview is the same object the form saves, so there is no second source
  // of truth to drift.
  const previewBook = useMemo(
    () => ({ title: trimmedTitle, subtitle, mark: mark.trim(), blurb, design }),
    [trimmedTitle, subtitle, mark, blurb, design]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) {
      document.getElementById("book-title")?.focus();
      return;
    }

    const payload = {
      title: trimmedTitle,
      subtitle: subtitle.trim(),
      blurb: blurb.trim(),
      mark: mark.trim(),
      genres,
      visibility,
      status,
      design,
      ...metadata,
      publishedAt: metadata.publishedAt || null,
      // `portraitFile` is a File and cannot be JSON-serialised, so it is held
      // back here and uploaded once the entries have server ids.
      characters: stripLocalFields(characters),
      places: stripLocalFields(places),
      sections: stripLocalFields(sections),
    };

    try {
      if (isEdit) {
        const { book } = await updateBook.mutateAsync({ id: bookId, ...payload });
        await uploadPendingPortraits(book.id, characters);
        navigate("/profile");
      } else {
        const { book } = await createBook.mutateAsync(payload);
        // Portraits cannot ride in the create call — the characters have no ids
        // until it returns. Upload them now that they do.
        await uploadPendingPortraits(book.id, characters);
        // Straight to the studio, carrying the real id. The studio does not read
        // it yet — pages are the next piece — but the URL is right from here on.
        navigate(`/write?book=${book.id}`, { replace: true });
      }
    } catch {
      // Surfaced below from the mutation's error rather than swallowed here.
    }
  };

  if (isEdit && (existing.isLoading || !user)) {
    return (
      <p className="flex items-center gap-2 font-code text-xs text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading book
      </p>
    );
  }

  // Not yours — checked here, not left to the save.
  //
  // `GET /api/books/:id` deliberately lets any reader *open* a public book, so
  // the form would otherwise load, look entirely legitimate, and only reject at
  // the bottom with "Only the author can change this book". A working-looking
  // editor you are not allowed to submit is worse than being told up front.
  //
  // Admins are not exempt: the server's PATCH is author-only (an admin may
  // delete a book, not edit one), so showing them the form would be a promise
  // the API then breaks.
  if (isEdit && existing.data && !isMine) {
    return (
      <Refusal
        heading="This is not your book"
        body={`${existing.data.author?.name ?? "Another author"} wrote it. You can read it, but only the author can change it.`}
      />
    );
  }

  // 403/404 land here too, and the server's message is the useful one.
  if (isEdit && existing.isError) {
    return <Refusal heading="Cannot edit this book" body={existing.error.message} />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={isEdit ? "/profile" : "/library"}
        className="mb-5 inline-flex items-center gap-1.5 font-code text-[11px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {isEdit ? "Back to your profile" : "Back to bookshelf"}
      </Link>

      <header className="mb-7 flex flex-col gap-2 border-b border-zinc-200 pb-6">
        <h1 className="font-heading text-3xl font-semibold uppercase tracking-wide text-zinc-950 sm:text-4xl">
          {isEdit ? "Edit book" : "Bind a new book"}
        </h1>
        <p className="max-w-2xl font-body text-sm leading-relaxed text-zinc-600">
          {isEdit ? (
            <>
              Changes are not saved until you press save.{" "}
              {dirty ? (
                <span className="text-zinc-900">You have unsaved changes.</span>
              ) : (
                <span>Nothing changed yet.</span>
              )}
            </>
          ) : (
            <>
              A book is an ordered stack of pages. Name it, then design the cover —
              the preview updates as you go, and you can change all of it later.
            </>
          )}
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Preview rail */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <span className={label}>Cover preview</span>
            <BookCover
              book={previewBook}
              className="w-full border border-zinc-200 shadow-sm"
              coverSrc={coverUrl}
            />

            <dl className="mt-4 space-y-1.5 font-code text-[11px] text-zinc-600">
              <div className="flex justify-between gap-3">
                <dt>Layout</dt>
                <dd className="text-zinc-950">
                  {LAYOUTS.find((l) => l.key === design.layout)?.label}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Contrast</dt>
                <dd
                  className={cn(
                    "flex items-center gap-1.5",
                    readable ? "text-zinc-950" : "text-zinc-700"
                  )}
                >
                  {readable ? <Check className="h-3 w-3" /> : <Contrast className="h-3 w-3" />}
                  {contrast.toFixed(1)}:1 {readable ? "AA" : "too low"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Visibility</dt>
                <dd className="text-zinc-950">{visibility}</dd>
              </div>
              {isEdit && (
                <div className="flex justify-between gap-3">
                  <dt>Image</dt>
                  <dd className="text-zinc-950">
                    {hasCover ? "uploaded, behind the title" : "generated only"}
                  </dd>
                </div>
              )}
            </dl>

            {touched && invalid && (
              <p className="mt-3 font-code text-[11px] text-zinc-700">A book needs a title.</p>
            )}

            {saveError && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 font-code text-[11px] leading-relaxed text-zinc-800"
              >
                {saveError.message}
                {saveError.data?.error?.validation?.keys?.length > 0 && (
                  <span className="text-zinc-950">
                    {' '}
                    — {saveError.data.error.validation.keys.join(', ')}
                  </span>
                )}
              </p>
            )}
          </div>
        </aside>

        {/* Fields */}
        <div className="flex flex-col gap-7 lg:col-span-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field htmlFor="book-title" label="Title" hint="required">
                <input
                  id="book-title"
                  value={title}
                  onChange={(e) => change(setTitle)(e.target.value)}
                  placeholder="Zindagi Ke Kuch Panne"
                  aria-invalid={touched && invalid}
                  aria-required="true"
                  className={cn(field, "font-heading text-lg")}
                />
              </Field>
            </div>

            <Field htmlFor="book-subtitle" label="Subtitle" hint="optional">
              <input
                id="book-subtitle"
                value={subtitle}
                onChange={(e) => change(setSubtitle)(e.target.value)}
                placeholder="Notes from the last ten years"
                className={field}
              />
            </Field>

            <Field
              htmlFor="book-mark"
              label="Mark"
              hint={
                design.layout === "mark-only"
                  ? "used on the cover — required by this layout"
                  : "optional, on the spine"
              }
            >
              <input
                id="book-mark"
                value={mark}
                onChange={(e) => change(setMark)(e.target.value)}
                placeholder="VOL. I"
                className={cn(field, "font-code text-xs uppercase tracking-wider")}
              />
            </Field>
          </div>

          <Field htmlFor="book-blurb" label="What is it about" hint="optional">
            <textarea
              id="book-blurb"
              value={blurb}
              onChange={(e) => change(setBlurb)(e.target.value)}
              rows={3}
              placeholder="One or two sentences. This is what readers see before they commit."
              className={cn(field, "resize-none leading-relaxed")}
            />
          </Field>

          <fieldset>
            <legend className={label}>
              Genres{" "}
              <span className="normal-case tracking-normal text-zinc-500">
                up to {MAX_GENRES}
              </span>
            </legend>
            <GenrePicker value={genres} onChange={change(setGenres)} />
          </fieldset>

          {/* Story bible. Collapsed by default: an author opening "new book" to
              type a title should not scroll past three empty lists to reach
              Save. Each opens on its own if it already holds something. */}
          <FormGroup
            id="group-characters"
            title="Characters"
            hint="Optional. A name is enough to start."
            count={characters.length}
          >
            <CharacterEditor
              items={characters}
              onChange={change(setCharacters)}
              bookId={bookId}
              disabled={saving}
            />
          </FormGroup>

          <FormGroup
            id="group-sections"
            title="Outline"
            hint="Optional. Parts and chapters, in order."
            count={sections.length}
          >
            <SectionEditor
              items={sections}
              onChange={change(setSections)}
              disabled={saving}
            />
          </FormGroup>

          <FormGroup
            id="group-places"
            title="Places"
            hint="Optional. Where the book is set."
            count={places.length}
          >
            <PlaceEditor items={places} onChange={change(setPlaces)} disabled={saving} />
          </FormGroup>

          <FormGroup
            id="group-metadata"
            title="About this book"
            hint="Optional. Language, series, themes, publication."
            count={countFilledMetadata(metadata)}
          >
            <BookMetadataFields
              value={metadata}
              onChange={change(setMetadata)}
            />
          </FormGroup>

          <fieldset className="rounded-xl border border-zinc-200 bg-white p-4">
            <legend className="px-1 font-code text-[11px] uppercase tracking-widest text-zinc-600">
              Cover design
            </legend>
            <CoverDesigner
              design={design}
              onChange={change(setDesign)}
              bookId={bookId}
              hasCover={hasCover}
              coverUrl={coverUrl}
              onCoverChange={(next) => {
                setHasCover(next);
                setDirty(true);
              }}
              disabled={saving}
            />
          </fieldset>

          <fieldset>
            <legend className={label}>Visibility</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {VISIBILITY.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => change(setVisibility)(option.key)}
                  aria-pressed={visibility === option.key}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                    visibility === option.key
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 hover:border-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <span className="font-code text-[11px] uppercase tracking-wider">
                    {option.label}
                  </span>
                  <span className={cn("text-xs", visibility === option.key ? "text-zinc-300" : "text-zinc-600")}>
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={label}>Status</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {STATUS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => change(setStatus)(option.key)}
                  aria-pressed={status === option.key}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                    status === option.key
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 hover:border-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <span className="font-code text-[11px] uppercase tracking-wider">
                    {option.label}
                  </span>
                  <span className={cn("text-xs", status === option.key ? "text-zinc-300" : "text-zinc-600")}>
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEdit ? (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Feather className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {saving ? "Saving" : isEdit ? "Save changes" : "Create and start writing"}
            </button>
            <Link
              to={isEdit ? "/profile" : "/library"}
              className="rounded-lg border border-zinc-200 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Create. */
export function NewBookPage() {
  return <BookForm />;
}

/** Edit an existing book. */
export function BookEditPage() {
  const { id } = useParams();
  return <BookForm key={id} bookId={id} />;
}
