import { BookOpen, Brain, Landmark, NotebookPen, PenLine, Quote, ScrollText } from "lucide-react";

// Maps the string glyph keys stored in the data layer to lucide components,
// so src/data/books.js stays free of React imports.
const GLYPHS = {
  book: BookOpen,
  note: NotebookPen,
  notes: NotebookPen,
  landmark: Landmark,
  brain: Brain,
  quote: Quote,
  page: ScrollText,
  pen: PenLine,
};

export { GLYPHS };
