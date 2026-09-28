import { Field, formField } from "@/components/Field";
import { StoryEntityList, ChoiceField } from "@/components/StoryEntityList";
import { TagPicker } from "@/components/TagPicker";
import { PortraitSlot } from "@/components/PortraitSlot";

/**
 * The three story-bible editors.
 *
 * All of them are the same `StoryEntityList` with different fields, which is why
 * they live in one file: the collection shape, the add/reorder/remove behaviour
 * and the `key` discipline are identical, and splitting them across three files
 * would make that sameness invisible and easy to break in one place only.
 *
 * Every field is optional except the name/title — a character with no portrait,
 * no age and no description is still a character, and demanding a description
 * would just produce placeholder prose nobody wrote on purpose.
 */

const ROLES = [
  { key: "protagonist", label: "Protagonist" },
  { key: "antagonist", label: "Antagonist" },
  { key: "narrator", label: "Narrator" },
  { key: "supporting", label: "Supporting" },
  { key: "minor", label: "Minor" },
];

const PLACE_KINDS = [
  { key: "other", label: "Other" },
  { key: "city", label: "City" },
  { key: "town", label: "Town" },
  { key: "village", label: "Village" },
  { key: "country", label: "Country" },
  { key: "region", label: "Region" },
  { key: "building", label: "Building" },
  { key: "landmark", label: "Landmark" },
];

const SECTION_KINDS = [
  { key: "chapter", label: "Chapter" },
  { key: "part", label: "Part" },
  { key: "prologue", label: "Prologue" },
  { key: "section", label: "Section" },
  { key: "epilogue", label: "Epilogue" },
  { key: "afterword", label: "Afterword" },
];

/* ---------------------------------------------------------------- characters */

const emptyCharacter = () => ({
  name: "",
  aliases: [],
  role: "supporting",
  description: "",
  age: "",
  firstAppearance: "",
  tags: [],
  portraitFile: null,
});

export function CharacterEditor({ items, onChange, bookId, disabled }) {
  return (
    <StoryEntityList
      items={items}
      onChange={onChange}
      createEmpty={emptyCharacter}
      singular="character"
      plural="characters"
      disabled={disabled}
      emptyHint="No characters yet. A name is enough to start — the rest can follow as the story does."
      renderSummary={(c) => c.name?.trim() || "Untitled character"}
      renderBody={(c, update) => (
        <>
          <PortraitSlot
            bookId={bookId}
            entityId={c.id}
            name={c.name}
            file={c.portraitFile}
            onFileChange={(f) => update({ portraitFile: f })}
            disabled={disabled}
          />

          <Field htmlFor={`char-name-${c.key}`} label="Name" hint="required">
            <input
              id={`char-name-${c.key}`}
              value={c.name ?? ""}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Amma"
              className={formField}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceField
              id={`char-role-${c.key}`}
              label="Role"
              value={c.role ?? "supporting"}
              onChange={(role) => update({ role })}
              options={ROLES}
              disabled={disabled}
            />
            <Field htmlFor={`char-age-${c.key}`} label="Age" hint="optional">
              <input
                id={`char-age-${c.key}`}
                value={c.age ?? ""}
                onChange={(e) => update({ age: e.target.value })}
                placeholder="late forties"
                className={formField}
              />
            </Field>
          </div>

          <Field htmlFor={`char-aliases-${c.key}`} label="Also called" hint="optional, up to 8">
            <TagPicker
              id={`char-aliases-${c.key}`}
              value={c.aliases ?? []}
              onChange={(aliases) => update({ aliases })}
              max={8}
              label="alias"
            />
          </Field>

          <Field
            htmlFor={`char-first-${c.key}`}
            label="First appears"
            hint="optional, in your own words"
          >
            <input
              id={`char-first-${c.key}`}
              value={c.firstAppearance ?? ""}
              onChange={(e) => update({ firstAppearance: e.target.value })}
              placeholder="page 1, the ghats"
              className={formField}
            />
          </Field>

          <Field htmlFor={`char-desc-${c.key}`} label="Description" hint="optional">
            <textarea
              id={`char-desc-${c.key}`}
              value={c.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              placeholder="Who they are, and what they want."
              className={`${formField} resize-none leading-relaxed`}
            />
          </Field>

          <Field htmlFor={`char-tags-${c.key}`} label="Tags" hint="optional">
            <TagPicker
              id={`char-tags-${c.key}`}
              value={c.tags ?? []}
              onChange={(tags) => update({ tags })}
              max={12}
              label="tag"
            />
          </Field>
        </>
      )}
    />
  );
}

/* -------------------------------------------------------------------- places */

const emptyPlace = () => ({ name: "", kind: "other", description: "", tags: [] });

export function PlaceEditor({ items, onChange, disabled }) {
  return (
    <StoryEntityList
      items={items}
      onChange={onChange}
      createEmpty={emptyPlace}
      singular="place"
      plural="places"
      disabled={disabled}
      emptyHint="No places yet. Useful when a name has to stay the same across forty pages."
      renderSummary={(p) => p.name?.trim() || "Untitled place"}
      renderBody={(p, update) => (
        <>
          <Field htmlFor={`place-name-${p.key}`} label="Name" hint="required">
            <input
              id={`place-name-${p.key}`}
              value={p.name ?? ""}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Banaras"
              className={formField}
            />
          </Field>

          <ChoiceField
            id={`place-kind-${p.key}`}
            label="Kind"
            value={p.kind ?? "other"}
            onChange={(kind) => update({ kind })}
            options={PLACE_KINDS}
            disabled={disabled}
          />

          <Field htmlFor={`place-desc-${p.key}`} label="Description" hint="optional">
            <textarea
              id={`place-desc-${p.key}`}
              value={p.description ?? ""}
              onChange={(e) => update({ description: e.target.value })}
              rows={3}
              placeholder="What it is like. What the characters do there."
              className={`${formField} resize-none leading-relaxed`}
            />
          </Field>

          <Field htmlFor={`place-tags-${p.key}`} label="Tags" hint="optional">
            <TagPicker
              id={`place-tags-${p.key}`}
              value={p.tags ?? []}
              onChange={(tags) => update({ tags })}
              max={12}
              label="tag"
            />
          </Field>
        </>
      )}
    />
  );
}

/* ------------------------------------------------------------------ sections */

const emptySection = () => ({ title: "", kind: "chapter", summary: "", tags: [] });

export function SectionEditor({ items, onChange, disabled }) {
  return (
    <StoryEntityList
      items={items}
      onChange={onChange}
      createEmpty={emptySection}
      singular="section"
      plural="sections"
      max={200}
      disabled={disabled}
      emptyHint="No outline yet. Parts and chapters give a flat pile of pages something to hang from."
      renderSummary={(s) => s.title?.trim() || "Untitled section"}
      renderBody={(s, update) => (
        <>
          <Field htmlFor={`section-title-${s.key}`} label="Title" hint="required">
            <input
              id={`section-title-${s.key}`}
              value={s.title ?? ""}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Chapter One"
              className={formField}
            />
          </Field>

          <ChoiceField
            id={`section-kind-${s.key}`}
            label="Kind"
            value={s.kind ?? "chapter"}
            onChange={(kind) => update({ kind })}
            options={SECTION_KINDS}
            disabled={disabled}
          />

          <Field htmlFor={`section-summary-${s.key}`} label="What happens" hint="optional">
            <textarea
              id={`section-summary-${s.key}`}
              value={s.summary ?? ""}
              onChange={(e) => update({ summary: e.target.value })}
              rows={3}
              placeholder="One or two lines so you remember the shape of it later."
              className={`${formField} resize-none leading-relaxed`}
            />
          </Field>
        </>
      )}
    />
  );
}

export { ROLES, PLACE_KINDS, SECTION_KINDS };
