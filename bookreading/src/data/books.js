// Single source of truth for the catalog. Discover links to /book/:id and
// BookPage resolves against this, so the two pages can never drift apart.

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

// The public author record. The author profile page derives every figure it
// shows from these fields plus the author's books, so nothing is hardcoded
// there.
const authors = {
  jay: {
    name: "Jay Rathod",
    username: "jayrathod",
    aliases: ["jay"],
    followers: 1240,
    following: 234,
    bio: "Exploring memory, transit, and quiet urban corners through verse and micro-essays.",
    location: "Ahmedabad, India",
    joined: "Sep 2024",
    verified: true,
    streak: 14,
    words: 18940,
    portrait: "https://picsum.photos/seed/jay-portrait/400/400",
  },
  neha: {
    name: "Neha Sharma",
    username: "nehasharma",
    followers: 3420,
    following: 512,
    bio: "Long-form essays on work, care, and the arithmetic of a shared kitchen.",
    location: "Bengaluru, India",
    joined: "Mar 2023",
    verified: true,
    streak: 6,
    words: 41200,
    portrait: "https://picsum.photos/seed/neha-portrait/400/400",
  },
  rahul: {
    name: "Rahul Verma",
    username: "rahulverma",
    followers: 890,
    following: 143,
    bio: "Field notes from rivers, railway yards, and other places that do not explain themselves.",
    location: "Vadodara, India",
    joined: "Nov 2024",
    verified: false,
    streak: 3,
    words: 9800,
    portrait: "https://picsum.photos/seed/rahul-portrait/400/400",
  },
  priya: {
    name: "Priya Patel",
    username: "priyapatel",
    followers: 2810,
    following: 396,
    bio: "Hostel stairwells, mess-hall dal, and every corridor that taught me something.",
    location: "Pune, India",
    joined: "Jun 2023",
    verified: true,
    streak: 21,
    words: 52300,
    portrait: "https://picsum.photos/seed/priya-portrait/400/400",
  },
  marcus: {
    name: "Marcus Rowe",
    username: "marcusrowe",
    followers: 1600,
    following: 208,
    bio: "Letters I did not send, and the replies that were shorter than I hoped.",
    location: "Lisbon, Portugal",
    joined: "Feb 2025",
    verified: false,
    streak: 9,
    words: 27600,
    portrait: "https://picsum.photos/seed/marcus-portrait/400/400",
  },
  elena: {
    name: "Elena Vance",
    username: "elenavance",
    followers: 4100,
    following: 671,
    bio: "Kept drafts. A record of every version I was not brave enough to delete.",
    location: "Edinburgh, UK",
    joined: "Aug 2022",
    verified: true,
    streak: 4,
    words: 68400,
    portrait: "https://picsum.photos/seed/elena-portrait/400/400",
  },
};

// Resolves /author/:username, the short alias, or the raw key.
const getAuthor = (handle) => {
  const wanted = String(handle ?? "").toLowerCase();
  const entry = Object.entries(authors).find(
    ([key, a]) =>
      key === wanted ||
      a.username.toLowerCase() === wanted ||
      (a.aliases ?? []).some((alias) => alias === wanted)
  );
  return entry ? { key: entry[0], ...entry[1] } : null;
};

const books = [
  {
    id: 1,
    title: "Zindagi Ke Kuch Panne",
    author: "jay",
    pages: 24,
    reads: 1240,
    likes: 12400,
    cover: null,
    glyph: "book",
    mark: "CHAP. IV",
    tag: "Prose",
    genres: ["Poetry & Ghazals", "Hindi / Urdu Literature"],
    blurb:
      "A collection of life's beautiful moments, one page at a time. Every page is a memory, every chapter a journey.",
    currentPage: 12,
  },
  {
    id: 2,
    title: "My Little Life",
    author: "neha",
    pages: 156,
    reads: 3420,
    likes: 21800,
    cover: "https://picsum.photos/seed/mylittlelife/450/600",
    tag: "Memoir",
    genres: ["Memoir & Essays"],
    blurb:
      "A small, stubborn memoir about growing up in a port city — the cranes, the monsoon, and everyone who left.",
    currentPage: 44,
  },
  {
    id: 3,
    title: "Ahmedabad Diaries",
    author: "rahul",
    pages: 42,
    reads: 890,
    likes: 7300,
    cover: null,
    glyph: "landmark",
    mark: "PART I",
    tag: "Chronicle",
    genres: ["Hindi / Urdu Literature"],
    blurb:
      "Street-level notes from a city that keeps rebuilding itself. Written in the margins of a two-year diary.",
    currentPage: 7,
  },
  {
    id: 4,
    title: "College Yaadein",
    author: "priya",
    pages: 98,
    reads: 2810,
    likes: 19600,
    cover: "https://picsum.photos/seed/collegeyaadein/450/600",
    tag: "Anthology",
    genres: ["Memoir & Essays"],
    blurb:
      "Seventeen writers on the four years they thought would last forever — the hostel, the library, the last day.",
    currentPage: 31,
  },
  {
    id: 5,
    title: "The Midnight Epistles",
    author: "marcus",
    pages: 64,
    reads: 1600,
    likes: 11200,
    cover: "https://picsum.photos/seed/midnightepistles/450/600",
    tag: "Letters",
    genres: ["Micro-Fiction", "Speculative Fiction"],
    blurb:
      "Forty letters that were never sent, and the one person who read them anyway. A quiet book about unfinished sentences.",
    currentPage: 18,
  },
  {
    id: 6,
    title: "Silent Monologues",
    author: "elena",
    pages: 112,
    reads: 4120,
    likes: 27400,
    cover: null,
    glyph: "notes",
    mark: "DRAFT #3",
    tag: "Draft",
    genres: ["Micro-Fiction", "Philosophy"],
    blurb:
      "Everything the narrator never said out loud, arranged as a draft. Third revision, and the honest one.",
    currentPage: 60,
  },
  {
    id: 7,
    title: "Kaagaz Ke Paar",
    author: "jay",
    status: "published",
    pages: 18,
    reads: 640,
    likes: 5100,
    cover: "https://picsum.photos/seed/jay2/400/500",
    glyph: "page",
    mark: "FOLIO II",
    tag: "Essays",
    genres: ["Hindi / Urdu Literature", "Personal Essay"],
    blurb:
      "Short essays on the small, stubborn things that refuse to leave — trains, debts, monsoon afternoons.",
    currentPage: 4,
  },
  {
    id: 8,
    title: "Adhoori Kahaniyan",
    author: "jay",
    status: "draft",
    pages: 31,
    reads: 310,
    likes: 2400,
    cover: null,
    glyph: "pen",
    mark: "FOLIO III",
    tag: "Draft",
    genres: ["Short Fiction", "Hindi / Urdu Literature"],
    blurb:
      "Unfinished on purpose. Some stories need to be left mid-sentence until the writer catches up.",
    currentPage: 9,
  },
];

// --- pages (sample entries rendered per book) -------------------------------

const pagesByBook = {
  1: [
    { title: "Pehla Pan", content: "ज़िन्दगी की शुरुआत कहीं से भी हो सकती है। कभी-कभी एक छोटा सा लम्हा, एक मुस्कान, या एक पुरानी याद — बस इतना काफ़ी होता है नई शुरुआत के लिए।", photo: null, mood: "✨", date: "24 Sep 2026", likes: 82, comments: 12, readTime: "2 min" },
    { title: "Yaadein", content: "कुछ यादें ऐसी होती हैं जो दिल में बस जाती हैं। वो बारिश की पहली बूँद, वो ठंडी हवा का झोंका, वो किसी का हँसता हुआ चेहरा।", photo: "https://picsum.photos/seed/mem1/800/600", mood: "🌅", date: "23 Sep 2026", likes: 124, comments: 23, readTime: "3 min" },
    { title: "Subah Ki Chai", content: "वो सुबह की चाय, वो हल्की धूप, वो पंछियों की आवाज़। कुछ चीज़ें इतनी साधारण होती हैं लेकिन इतनी ख़ूबसूरत।", photo: null, mood: "☕", date: "22 Sep 2026", likes: 54, comments: 8, readTime: "2 min" },
    { title: "Dosti", content: "असली दोस्त वो होते हैं जो बिना बोले समझ जाते हैं। जो आपकी ख़ामोशी को भी सुन लेते हैं।", photo: null, mood: "❤️", date: "21 Sep 2026", likes: 203, comments: 45, readTime: "4 min" },
    { title: "Raat Ki Baatein", content: "रात को जब सब सो जाते हैं, तब दिल की बातें बाहर आती हैं। ख़ामोशी में भी बहुत कुछ कह जाता है।", photo: "https://picsum.photos/seed/night/800/600", mood: "🌙", date: "20 Sep 2026", likes: 167, comments: 34, readTime: "3 min" },
    { title: "Sapne", content: "हर किसी के सपने होते हैं, कुछ पूरे होते हैं, कुछ अधूरे रह जाते हैं। लेकिन सपने देखना बंद मत करो।", photo: null, mood: "💭", date: "19 Sep 2026", likes: 98, comments: 15, readTime: "2 min" },
  ],
  2: [
    { title: "The Crane at 6AM", content: "My father worked the night shift at the container terminal, so my first memories of him are of a silhouette against floodlights. He smelled of diesel and cardamom. He was forty for a very long time.", photo: "https://picsum.photos/seed/crane/900/600", mood: "🏗️", date: "18 Sep 2026", likes: 214, comments: 31, readTime: "4 min" },
    { title: "Monsoon, Ration Sugar", content: "Every June the sugar would run short and my mother would ration it, a half spoon each, precisely, into six steel tumblers. We learned early that scarcity has a shape.", photo: null, mood: "🌧️", date: "12 Sep 2026", likes: 176, comments: 22, readTime: "3 min" },
    { title: "Everyone Who Left", content: "There were nine of us on that street. Two stayed. I have spent thirty years trying to work out whether that was luck or a failure of imagination on my part.", photo: null, mood: "🚪", date: "04 Sep 2026", likes: 302, comments: 57, readTime: "5 min" },
    { title: "Little Life, Little Lie", content: "The title is a pun I regret and cannot undo. It was meant to be about scale — how a small life is still a whole one.", photo: null, mood: "📖", date: "28 Aug 2026", likes: 143, comments: 19, readTime: "3 min" },
  ],
  3: [
    { title: "Sabarmati, 5:40 AM", content: "The river is a different colour every morning. At 5:40 it is the colour of an unlit room. I have written this sentence in three different diaries and it keeps not improving.", photo: "https://picsum.photos/seed/sabarmati/900/600", mood: "🌫️", date: "21 Sep 2026", likes: 96, comments: 14, readTime: "3 min" },
    { title: "The Relocation Notice", content: "Someone knocks on the door with a printed sheet and a smile that is entirely counterfeit. The city has done this to my street four times now.", photo: null, mood: "📄", date: "15 Sep 2026", likes: 131, comments: 28, readTime: "4 min" },
    { title: "Gully Inventory", content: "One tailor, two kirana shops, a cycle repair that only opens after six, and a man who repairs fans but will not say where he learned it.", photo: null, mood: "🧵", date: "09 Sep 2026", likes: 77, comments: 9, readTime: "2 min" },
    { title: "Diary, Second Year", content: "I have started writing in the present tense to make it feel less like an archive. It does not work but it is a good excuse to keep going.", photo: null, mood: "🖊️", date: "01 Sep 2026", likes: 64, comments: 7, readTime: "3 min" },
  ],
  4: [
    { title: "The Hostel Stairwell", content: "We used to sit on the third landing because it caught the last of the daylight and nobody thought to install a bulb there. Four years later I still cannot sit near a staircase without expecting someone to call me down.", photo: "https://picsum.photos/seed/stairwell/900/600", mood: "🪜", date: "22 Sep 2026", likes: 268, comments: 34, readTime: "4 min" },
    { title: "Library, Third Floor", content: "The third floor was where the aspirational went. First floor was textbooks, second was noise, third was somebody proving something about themselves. I spent three years on the second and have regrets.", photo: null, mood: "📚", date: "17 Sep 2026", likes: 341, comments: 62, readTime: "5 min" },
    { title: "The Mess Menu Cycle", content: "Fourteen days, fourteen rotations, and the same Thursday dal for four consecutive Thursdays. We complained about it for three years and then missed it immediately.", photo: null, mood: "🍛", date: "11 Sep 2026", likes: 297, comments: 48, readTime: "3 min" },
    { title: "Last Day, 6:10 AM", content: "The room was already stripped. Someone had taken the mirror off the wall and left a pale rectangle behind, which is somehow the most honest thing in this book.", photo: null, mood: "🪞", date: "05 Sep 2026", likes: 412, comments: 71, readTime: "6 min" },
    { title: "Seventeen of Us", content: "We promised to stay in touch and roughly a third of us managed it. That is a better ratio than I expected and a worse one than I wanted.", photo: null, mood: "✉️", date: "30 Aug 2026", likes: 189, comments: 26, readTime: "4 min" },
  ],
  5: [
    { title: "Letter One, Unsent", content: "You asked me once why I write at night. The honest answer is that at night the sentences stop asking permission. I did not send this, which is of course the point of it.", photo: null, mood: "🌙", date: "20 Sep 2026", likes: 223, comments: 41, readTime: "4 min" },
    { title: "The Desk Lamp Interval", content: "Between midnight and one there is a lightening of the shoulders. I have started timing it. This is either discipline or a very slow decline.", photo: "https://picsum.photos/seed/desklamp/900/600", mood: "💡", date: "14 Sep 2026", likes: 158, comments: 24, readTime: "3 min" },
    { title: "Forty, Minus One", content: "There are thirty-nine letters in this book and one letter from someone else, which is the only one that answers anything.", photo: null, mood: "✒️", date: "08 Sep 2026", likes: 279, comments: 53, readTime: "5 min" },
    { title: "The Reply", content: "She wrote back in nine words. I have built four chapters out of those nine words and I would do it again.", photo: null, mood: "📮", date: "02 Sep 2026", likes: 331, comments: 68, readTime: "4 min" },
  ],
  6: [
    { title: "Draft, First Attempt", content: "This was the first version and it was dishonest in the way that first drafts always are — too eager to be liked. Kept for the record.", photo: null, mood: "🗑️", date: "19 Sep 2026", likes: 197, comments: 33, readTime: "3 min" },
    { title: "The Bit That Stayed", content: "One paragraph survived every cut. It is four sentences long and it is the reason the book exists.", photo: "https://picsum.photos/seed/manuscript/900/600", mood: "✂️", date: "13 Sep 2026", likes: 254, comments: 44, readTime: "4 min" },
    { title: "Second Revision", content: "Better. Emphatic. I can hear myself being emphatic, which is its own kind of failure.", photo: null, mood: "📝", date: "07 Sep 2026", likes: 166, comments: 21, readTime: "3 min" },
    { title: "Third Revision, the Honest One", content: "Shorter, quieter, and closer to the thing I actually meant. Nobody has read this version yet, which is its own kind of safety.", photo: null, mood: "🕯️", date: "01 Sep 2026", likes: 388, comments: 76, readTime: "5 min" },
  ],
};

const recentReaders = [
  { id: 1, name: "Neha S." },
  { id: 2, name: "Rahul V." },
  { id: 3, name: "Priya P." },
  { id: 4, name: "Amit S." },
  { id: 5, name: "Sara C." },
  { id: 6, name: "Marcus R." },
];

// Reader annotations seeded onto pages. Shared so the page view and the zen
// reader never disagree about who has annotated what.
const annotations = [
  { id: 1, author: "Neha Sharma", handle: "nehasharma", text: "This is so beautifully written.", likes: 5, time: "2 hours ago" },
  { id: 2, author: "Rahul Verma", handle: "rahulverma", text: "Reminds me of our college days.", likes: 3, time: "5 hours ago" },
  { id: 3, author: "Priya Patel", handle: "priyapatel", text: "Kya baat hai! Dil ko chhu gaya.", likes: 2, time: "1 day ago" },
];

const risers = [
  { id: 1, name: "Jay Rathod", stat: "24 pages · 1,240 readers" },
  { id: 2, name: "Neha Sharma", stat: "156 pages · 3,420 readers" },
  { id: 3, name: "Rahul Verma", stat: "42 pages · 890 readers" },
  { id: 4, name: "Sara Chen", stat: "88 pages · 2.1k readers" },
];

const genres = [
  "All Genres",
  "Poetry & Ghazals",
  "Memoir & Essays",
  "Speculative Fiction",
  "Philosophy",
  "Hindi / Urdu Literature",
  "Micro-Fiction",
  "Audio Excerpts",
];

// Resolves a book plus its author and pages; falls back to the first book so
// an unknown :id renders something rather than crashing.
const getBook = (id) => {
  const book = books.find((b) => b.id === Number(id)) ?? books[0];
  return {
    ...book,
    authorInfo: authors[book.author],
    pagesList: (pagesByBook[book.id] ?? []).map((page, i) => ({ ...page, id: i + 1 })),
  };
};

// Stands in for a book that has no sample pages yet, so the page view renders
// an empty state instead of throwing on undefined.
const BLANK_PAGE = {
  title: "Untitled Page",
  content: "",
  photo: null,
  mood: "",
  date: "",
  readTime: "1 min",
  likes: 0,
  comments: 0,
};

// Resolves one page within one book, plus its siblings. Page ids restart at 1
// per book, so the book has to travel with the page id.
const getPage = (bookId, pageId) => {
  const book = getBook(bookId);
  const list = book.pagesList.length ? book.pagesList : [BLANK_PAGE];
  const target = Number(pageId);
  // A missing or out-of-range id falls back to the first page rather than
  // rendering an empty article.
  const found = list.findIndex((p) => p.id === target);
  const index = found === -1 ? 0 : found;
  return {
    book,
    pages: list,
    page: list[index],
    pageIndex: index,
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
};

// The reader's own shelves. Reading progress is library state, so it lives here
// rather than on the book record.
const library = {
  "currently-reading": [
    { bookId: 1, current: 12, lastRead: "2 hours ago" },
    { bookId: 2, current: 89, lastRead: "Yesterday" },
    { bookId: 4, current: 31, lastRead: "4 days ago" },
  ],
  "read-later": [
    { bookId: 3, current: 0, lastRead: null },
    { bookId: 5, current: 0, lastRead: null },
  ],
  favorites: [
    { bookId: 2, current: 89, lastRead: "Yesterday" },
    { bookId: 6, current: 0, lastRead: null },
  ],
  completed: [{ bookId: 6, current: 112, lastRead: "12 Aug 2026" }],
};

const SHELVES = [
  { key: "currently-reading", label: "Reading" },
  { key: "read-later", label: "Read Later" },
  { key: "favorites", label: "Favorites" },
  { key: "completed", label: "Done" },
];

const emptyMessages = {
  "currently-reading": "Start reading a book to see it here.",
  "read-later": "Save books to read later.",
  favorites: "Mark books as favorites.",
  completed: "Finish a manuscript to see it here.",
};

// Joins a shelf of {bookId, current, lastRead} entries against the catalog.
const getShelf = (key) =>
  (library[key] ?? []).map((entry) => {
    const book = getBook(entry.bookId);
    const current = Math.min(entry.current, book.pages);
    return {
      ...entry,
      book,
      current,
      progress: book.pages ? Math.round((current / book.pages) * 100) : 0,
    };
  });

// The most recently touched in-progress book, used for the resume band.
const getResumeTarget = () => {
  const entries = getShelf("currently-reading");
  return entries.find((e) => e.current > 0) ?? null;
};

export {
  books,
  authors,
  getAuthor,
  annotations,
  genres,
  risers,
  recentReaders,
  library,
  SHELVES as shelves,
  emptyMessages,
  getBook,
  getPage,
  getShelf,
  getResumeTarget,
  compact,
};
