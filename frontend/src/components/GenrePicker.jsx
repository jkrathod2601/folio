import { TagPicker } from "@/components/TagPicker";
import { MAX_GENRES } from "@/lib/bookDesign";
import { genres as catalogGenres } from "@/data/books";

/**
 * Suggestion chips, minus the "All Genres" pseudo-entry used by the filter.
 */
const SUGGESTED = catalogGenres.filter((g) => g !== "All Genres");

/**
 * Genre input: suggestions plus free text.
 *
 * A thin wrapper over `TagPicker` so the behaviour lives in one place — this
 * and the four other tag lists on the book form are the same control with a
 * different noun, and they were about to diverge.
 */
function GenrePicker({ value, onChange, error }) {
  return (
    <TagPicker
      id="book-genres"
      value={value}
      onChange={onChange}
      max={MAX_GENRES}
      label="genre"
      suggestions={SUGGESTED}
      error={error}
    />
  );
}

export { GenrePicker };
