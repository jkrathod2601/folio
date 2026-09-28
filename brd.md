# Social Book Writing Platform — Product Understanding & Feature Specification

## 1. Product Vision

Build a social-first online writing and reading platform where people can **write books chapter-by-chapter, publish them publicly, build an audience, and involve readers while the story is being created**.

The core concept is:

> **Don't just publish your book. Build it with your readers.**

The platform should feel like a combination of:
- A modern writing/editor application
- A serialized book-reading platform
- A social network
- A lightweight publishing platform

The product should NOT simply become another generic blogging platform.

---

# 2. Core Product Loop

The main product loop is:

```text
Create Book
    ↓
Write Chapter
    ↓
Publish Chapter
    ↓
Readers Discover It
    ↓
Readers Read
    ↓
React / Comment / Vote / Follow
    ↓
Author Gets Feedback
    ↓
Author Writes Next Chapter
    ↓
Repeat
    ↓
Complete Book
```

The most important differentiator is that the **book is a social object** and readers can participate while it is being written.

---

# 3. Target Users

## 3.1 Writers

People who want to:
- Write fiction
- Write non-fiction
- Publish books online
- Build an audience
- Get feedback
- Write consistently
- Eventually monetize their work

## 3.2 Readers

People who want to:
- Discover new books
- Read serialized chapters
- Follow authors
- Follow individual books
- React to chapters
- Comment
- Vote in story polls
- Save books
- Receive notifications for new chapters

## 3.3 Communities

Later, the platform can support:
- Writing communities
- Genre communities
- Collaborative books
- Writing challenges
- Competitions

---

# 4. Main Navigation

Recommended initial navigation:

```text
Home
Discover
Write
Library
Notifications
Profile
```

Desktop can additionally have a left sidebar.

Mobile should use a bottom navigation bar.

---

# 5. Home Feed

The Home page is the primary social experience.

Users should see content such as:

### Following Feed

- New chapters from followed books
- Posts from followed authors
- Polls
- Writing milestones

### Recommended Feed

- Trending books
- Popular chapters
- New writers
- Books matching reading history
- Genre recommendations

Example:

```text
🔥 Jay published Chapter 12 of "The Last Train"

"The platform was completely empty..."

❤️ 542    😱 182    🔥 301
💬 87 comments

[Read Chapter]
```

The feed should prioritize **new writing and meaningful reader interaction**.

---

# 6. Book

A Book is the main content object.

Each book should contain:

- Title
- Subtitle
- Cover image
- Description
- Author
- Genre
- Tags
- Language
- Status
- Chapters
- Word count
- Followers
- Readers
- Reactions
- Comments
- Bookmarks
- Rating/reviews (optional later)
- Publication schedule
- Created date
- Updated date

## Book Status

Possible states:

- Draft
- Ongoing
- Completed
- Paused
- Hiatus
- Archived

---

# 7. Chapter System

Books are divided into chapters.

Each chapter should contain:

- Chapter number
- Chapter title
- Content
- Word count
- Estimated reading time
- Published date
- Updated date
- Reactions
- Comments
- Views/reads
- Bookmarks
- Polls (optional)
- Author notes

Authors can:

- Create chapter
- Save draft
- Preview
- Publish
- Unpublish
- Schedule publication
- Edit published chapter
- Duplicate chapter
- Delete chapter

Readers can:

- Read
- React
- Comment
- Highlight
- Bookmark
- Share
- Follow the book

---

# 8. Writing Editor

The writing editor is a core feature.

It should feel clean and distraction-free.

Initial editor features:

- Rich text editing
- Headings
- Bold
- Italic
- Underline
- Quotes
- Lists
- Links
- Images
- Autosave
- Word count
- Character count
- Reading time
- Undo/redo
- Fullscreen/distraction-free mode
- Draft status
- Publish button

Example:

```text
Chapter 12
The Last Train

--------------------------------

The rain had stopped.

Jay looked toward the platform...

--------------------------------

Words: 1,284
Reading time: 5 min

[Save Draft]       [Publish]
```

---

# 9. Writing Streak

Encourage consistent writing.

Example:

```text
🔥 27 Day Writing Streak

Today
✓ 1,200 words

Weekly goal
4,500 / 5,000 words
```

Potential achievements:

- First 1,000 words
- 7-day streak
- 30-day streak
- 10 chapters published
- First completed book
- 100 followers
- 1,000 readers

Do not make gamification overwhelming in the MVP.

---

# 10. Social Reactions

Readers should have lightweight reactions.

Suggested reactions:

- ❤️ Loved it
- 😱 Shocked
- 😂 Funny
- 😭 Emotional
- 🔥 Amazing
- 🤯 Mind blown

The platform should track reactions per chapter.

Example:

```text
Chapter 12

❤️ 542
😱 182
😭 94
🔥 301
🤯 73
```

---

# 11. Comments

Readers can comment on chapters.

Basic MVP:

- Add comment
- Reply
- Like comment
- Delete own comment
- Report comment
- Author badge

Later:

- Mention users
- Comment sorting
- Pinned author comment
- Comment moderation
- Highlight-to-comment

---

# 12. Sentence-Level / Highlight Comments

This is a potentially important differentiator.

A reader can select/highlight a sentence or paragraph and comment on it.

Example:

```text
"The train stopped at midnight."

        ↑ highlighted

💬 "This line creates a great atmosphere."
```

This should be considered a Phase 2 feature because it requires more complex text anchoring and version handling.

---

# 13. Story Polls

Authors can ask readers questions.

Example:

```text
What should Alex do?

○ Enter the house
○ Run away
○ Call Maya

        [Vote]
```

Results:

```text
Enter the house     61%
Run away             21%
Call Maya            18%
```

The author can use the poll as inspiration for the next chapter.

Important:
- Poll results should not force the author to follow the result.
- Clearly communicate that polls influence the story but do not control it.

---

# 14. Book Following

Users can follow individual books.

This is different from following an author.

Example:

```text
📖 The Last Train
@Jay

1,240 readers

[Following]
```

When a new chapter is published:

```text
🔔 The Last Train has a new chapter.
Chapter 13 is now available.
```

---

# 15. Author Following

Users can follow authors.

Following an author should expose:

- New books
- New chapters
- Writing milestones
- Optional author posts

---

# 16. Library

Users should have a personal library.

Suggested sections:

```text
❤️ Favorites
📖 Currently Reading
⏳ Read Later
✓ Completed
📚 My Books
```

A user should be able to save books and continue reading from the last chapter.

---

# 17. Reading Progress

Track reader progress.

Example:

```text
The Last Train

Chapter 12 / 30

████████████░░░░ 60%

Last read:
Chapter 12
```

When opening the book again:

```text
Continue Reading
```

---

# 18. Discover

Discover should help readers find books.

Sections:

```text
🔥 Trending
🆕 New Releases
📈 Rising Writers
❤️ Popular This Week
🎯 Recommended For You
📚 Genres
🌎 Languages
```

Genres could include:

- Romance
- Thriller
- Mystery
- Fantasy
- Science Fiction
- Horror
- Adventure
- Drama
- Comedy
- Self Help
- Business
- Technology
- Poetry
- Biography

---

# 19. Search

Search should support:

- Books
- Authors
- Genres
- Tags
- Chapters

Filters:

- Genre
- Language
- Completed/Ongoing
- Popularity
- Newest

---

# 20. Author Profile

Example:

```text
Jay Rathod
@jay

1.2K Followers
8 Books
4 Completed

Bio...

[Follow]

Books
├── The Last Train
├── A Letter Never Sent
└── ...
```

Profile can later include:

- Writing streak
- Achievements
- Total reads
- Followers
- Author posts

---

# 21. Book Page

Book page should provide:

```text
[Cover]

THE LAST TRAIN
by Jay Rathod

A mysterious story...

❤️ 1.2K readers
📖 18 chapters
⏱ 2h 20m reading

[Start Reading]
[Follow Book]

Chapters
01 — The Platform
02 — Midnight
03 — The Stranger
...
```

Also:

- About
- Characters
- Comments/community
- Updates
- Author

---

# 22. Draft and Visibility

Authors need control over visibility.

Book/chapter visibility:

### Private
Only author.

### Followers
Only followers.

### Public
Anyone can read.

### Scheduled
Automatically publish at a specified date/time.

---

# 23. Scheduled Publishing

Authors can prepare chapters in advance.

Example:

```text
Monday      Chapter 10
Wednesday   Chapter 11
Friday      Chapter 12
Sunday      Chapter 13
```

The system automatically publishes chapters according to the schedule.

---

# 24. Notifications

Notifications should include:

- New chapter from followed book
- New follower
- Comment on your chapter
- Reply to your comment
- Reaction
- Poll result
- Book milestone
- Scheduled chapter published
- Author you follow published a new book

Notification preferences should be configurable.

---

# 25. AI Writing Assistant

AI should be an optional assistant, not the author.

Possible features:

### Writing

- Improve grammar
- Rewrite selected text
- Change tone
- Make dialogue more natural
- Continue a paragraph
- Generate ideas

### Book intelligence

- Summarize chapter
- Generate chapter title
- Generate book description
- Extract characters
- Track character information
- Detect inconsistent character details
- Detect repetitive writing
- Suggest plot ideas

### Reader AI

Later:

- Ask questions about the book
- Character Q&A
- Chapter summaries
- "What happened previously?"

AI-generated content must be clearly distinguishable from the author's original writing.

---

# 26. Character System

Authors can define characters.

Example:

```text
Character: Maya

Age: 25
Occupation: Journalist

Personality:
Fearless
Curious
Independent

Relationships:
Alex → Friend
John → Rival
```

This information can later be used by the AI assistant for consistency.

---

# 27. Story World / Universe

For advanced fiction writers:

```text
WORLD

Characters
Locations
Organizations
Timeline
Important Events
Relationships
```

This is a Phase 2/3 feature.

---

# 28. Collaborative Writing

Later, multiple authors can collaborate on a book.

Example:

```text
Book
├── Author A
├── Author B
└── Editor
```

Permissions:

- Owner
- Co-author
- Editor
- Viewer

This should NOT be required for the MVP.

---

# 29. Social Author Posts

Authors can optionally post outside their chapters.

Examples:

```text
✍️ Writing update

Chapter 10 is almost ready.

What do you think Alex should do next?
```

This makes the platform more social.

Keep author posts separate from actual book chapters.

---

# 30. Book Sharing

Users can share:

- Book
- Chapter
- Author profile
- Specific quote

Generate shareable links and preview cards.

---

# 31. Reading Analytics

Authors should get analytics.

MVP:

- Total readers
- Chapter views
- Followers
- Reactions
- Comments
- Bookmarks
- Completion rate

Later:

- Reader retention
- Chapter drop-off
- Geographic analytics
- Reading time
- New vs returning readers
- Best-performing chapters

---

# 32. Author Dashboard

Example:

```text
Dashboard

Total Readers       12,430
Followers            2,840
Books                   4
Chapters               48
Words Written       182,430

This Week

Readers       +12%
Followers     +8%
Comments      +24%
```

---

# 33. Moderation and Safety

Required from early versions because this is user-generated content.

Need:

- Report book
- Report chapter
- Report comment
- Block user
- Mute user
- Admin moderation
- Spam detection
- Abuse detection
- Copyright complaint workflow
- Account suspension
- Content guidelines
- Age/content labeling

---

# 34. Monetization — Later

Do not make monetization the MVP focus.

Possible models:

### Premium Writer

Subscription for:

- Advanced analytics
- AI tools
- Custom themes
- Advanced publishing
- Larger storage
- Export tools

### Paid Chapters

Authors can lock chapters.

### Paid Books

Users purchase completed books.

### Tips

Readers can support authors.

### Platform commission

Take a percentage of transactions.

Any payment system should account for local taxes, refunds, fraud, and applicable laws.

---

# 35. Export

Authors should eventually be able to export:

- PDF
- EPUB
- DOCX
- Markdown

Potential future feature:

```text
Export as Kindle-ready EPUB
```

---

# 36. Languages

The platform should be designed for multilingual content from the beginning.

Potential languages:

- English
- Hindi
- Gujarati
- Marathi
- Bengali
- Tamil
- Telugu
- Kannada
- Malayalam
- Punjabi

Do not hard-code the application around English-only assumptions.

---

# 37. Localization

Support:

- UI translations
- RTL languages later if needed
- Unicode
- Indian languages
- Localized dates
- Localized numbers

---

# 38. MVP Scope

The first version should remain small.

## MVP — Writer

- Sign up/login
- Author profile
- Create book
- Upload book cover
- Book description
- Create chapters
- Rich text editor
- Autosave
- Drafts
- Publish chapter
- Edit chapter
- Delete chapter
- Basic writing statistics

## MVP — Reader

- Home feed
- Discover
- Book page
- Chapter reading
- Follow book
- Follow author
- Reactions
- Comments
- Bookmark
- Reading progress
- Library
- Notifications

## MVP — Social

- Feed
- Trending books
- New chapters
- Reactions
- Comments
- Follows

## MVP — Admin

- User management
- Book moderation
- Report management
- Comment moderation
- Basic platform analytics

---

# 39. Phase 2

- Chapter polls
- Sentence-level comments
- Writing streak
- Achievements
- Scheduled publishing
- Advanced analytics
- AI writing assistant
- Character profiles
- Author posts
- Better recommendations
- Book sharing cards

---

# 40. Phase 3

- Collaborative writing
- Story universe
- Character relationships
- AI book assistant
- Paid books
- Paid chapters
- Tips
- Writer subscriptions
- EPUB/PDF export
- Audio books
- AI translation
- Interactive stories

---

# 41. Product Differentiation

The product should not position itself simply as:

> "A website to publish books."

The stronger positioning is:

> **"A social platform for building books in public."**

Core differentiation:

```text
Traditional Publishing
        ↓
Write → Finish → Publish

This Platform
        ↓
Write → Publish → Readers React
       → Readers Vote
       → Readers Discuss
       → Author Writes
       → Repeat
```

The reader becomes part of the journey.

---

# 42. Competitive Awareness

The product concept overlaps with platforms such as:

- Wattpad
- Inkitt
- Royal Road

Therefore, the product should NOT compete only on "users can publish stories."

The differentiation should focus on:

- Better social feed
- Better chapter-level interaction
- Reader participation
- Modern writing experience
- Writing streaks
- Lightweight reactions
- Story polls
- AI-assisted writing
- Strong discovery
- Book-building-in-public experience

---

# 43. Important Product Principles

### 1. Writer owns their content

The author should maintain control over their work.

### 2. AI assists, not replaces

AI should help authors but should not automatically take over authorship.

### 3. Reading should be frictionless

Users should be able to start reading quickly.

### 4. Social interaction should be lightweight

A reader should be able to react in one tap.

### 5. New writers need discoverability

The recommendation system should not only promote already-famous writers.

### 6. Avoid excessive gamification

Streaks and leaderboards should encourage writing, not make the experience stressful.

### 7. Build mobile-first reading

Reading experience should work extremely well on phones.

### 8. Web-first writing

Desktop/web should provide the strongest writing experience initially.

---

# 44. Suggested Technical Direction

This is a product-level suggestion and can be changed by the implementation agent.

Potential stack:

```text
Frontend
Next.js / React
        ↓
Backend API
Node.js / FastAPI
        ↓
PostgreSQL
        ↓
Redis
        ↓
Object Storage
        ↓
AI Services
```

Potential services:

- PostgreSQL — users, books, chapters, comments, follows
- Redis — caching, feeds, rate limits, sessions
- Blob/Object Storage — book covers and media
- Search engine — books/authors/content search
- Queue system — notifications, scheduled publishing, AI jobs
- CDN — images/static content
- AI service — optional writing assistant

The implementation agent should choose the final stack based on requirements.

---

# 45. Important Data Entities

Initial conceptual entities:

```text
User
AuthorProfile
Book
Chapter
BookFollower
AuthorFollower
Reaction
Comment
CommentReply
Bookmark
ReadingProgress
Notification
Genre
Tag
BookTag
Draft
Report
AdminAction
```

Future:

```text
Poll
PollOption
PollVote
Character
Location
StoryEvent
Collaborator
Subscription
Payment
Tip
AIConversation
AIUsage
WritingStreak
Achievement
```

---

# 46. Open Product Questions

Before implementation, the product owner should decide:

## A. Platform identity

1. What is the final product name?
2. Is this primarily for fiction, non-fiction, or both?
3. Is the initial target market India or global?
4. Should the first version focus on English, Indian languages, or both?

## B. Publishing

5. Can anyone publish immediately?
6. Should new accounts have publishing limits?
7. Should books be moderated before publication?
8. Can authors edit chapters after publication?
9. Should readers see an "edited" indicator?

## C. Social

10. Should users be able to post normal social posts?
11. Should the feed contain only books/chapters or also author updates?
12. Should reactions be visible to everyone?
13. Should comment counts/reactions be public?

## D. Reader participation

14. Should polls be part of MVP?
15. Should authors be able to use reader votes to influence future chapters?
16. Should sentence-level comments be included in MVP or Phase 2?

## E. Monetization

17. Should the platform initially be completely free?
18. Will authors eventually be allowed to sell books?
19. Will paid chapters be supported?
20. Will the platform take commission?

## F. AI

21. Should AI be included in MVP?
22. Which AI features are most important initially?
23. Should AI-generated text be labeled?
24. Should authors be able to disable AI features completely?

## G. Content

25. What content is prohibited?
26. Will mature/18+ books be allowed?
27. Should books have age ratings?
28. What is the copyright complaint process?

## H. Discovery

29. How should trending be calculated?
30. Should new authors receive an algorithmic discovery boost?
31. Should recommendations be personalized from reading behavior?

## I. Writing

32. Do authors need Markdown support?
33. Do authors need image/video/audio inside chapters?
34. Should chapters support embedded media?
35. Should authors be able to export EPUB/PDF in the first release?

## J. Accounts

36. Email/password?
37. Google login?
38. Apple login?
39. Social login?
40. Username rules?

---

# 47. Recommended First Product Decision

Before building the full platform, define one clear MVP statement:

> **"A user can create a book, publish chapters one at a time, and build a community of readers around that book."**

Everything that does not directly support that loop can initially wait.

---

# 48. Agent Instruction

The implementation agent should treat this document as the current product understanding.

Before making major architectural or implementation decisions:

1. Identify ambiguities.
2. Ask the product owner targeted questions.
3. Do not invent critical product decisions.
4. Prefer MVP simplicity.
5. Design the system so Phase 2/3 features can be added later.
6. Keep writer content ownership and privacy in mind.
7. Treat user-generated content, moderation, rate limiting, and abuse prevention as production requirements.
8. Keep the architecture scalable without prematurely overengineering.
9. Document major assumptions.
10. Maintain a clear separation between:
   - Product requirements
   - Technical implementation
   - Future ideas

---

# 49. Current Status

This document represents the **initial product concept**, not a final PRD.

The product owner should answer the Open Product Questions before implementation of the full system.

The implementation agent should ask clarifying questions when a decision materially affects architecture, database design, UX, monetization, moderation, or the MVP scope.


# 50. Updated Product Direction — Visual Social Books

The product direction has evolved from a traditional serialized-book platform into a broader concept:

> **A social platform for creating beautiful digital books, one page at a time.**

The book is the container.
The page is the social post.
The feed is the discovery mechanism.

The experience should feel lightweight enough that a user can create a page in a few minutes rather than feeling like they need to "write a book."

---

# 51. New Core Use Case

A user can create a personal or collaborative book around any theme.

Examples:

- Shayari
- Poetry
- Daily routine
- Daily thoughts
- Travel diary
- Trip memories
- Relationship memories
- Family memories
- Friendship memories
- College life
- Work journey
- Fitness journey
- Gratitude journal
- Photography diary
- Personal journal
- Quotes
- Year-in-review
- Special events

A page can contain:

- Short text
- Shayari/poetry
- Photo
- Optional mood
- Minimal visual styling
- Date
- Author
- Optional location
- Optional music/audio in a future version

---

# 52. Page-First Creation Experience

The primary creation action should be:

> **Create Today's Page**

rather than forcing the user to think about writing a complete book.

Example:

```text
+ Create Page

📷 Add Photo

What's on your mind?

[ Write something... ]

Mood
😊  😔  ❤️  😎  🌧️  ✨

Date
24 September 2026

Style
Minimal
Paper
Dark
Photo

[Publish]
```

The user can then add that page to an existing book or create a new book.

---

# 53. Visual Page Concept

Pages should be visually beautiful but minimal.

Example:

```text
┌─────────────────────────────┐
│                             │
│          📷 PHOTO           │
│                             │
│                             │
│       आज फिर कुछ याद आया... │
│                             │
│  कुछ लोग दूर होकर भी        │
│       बहुत पास रहते हैं।    │
│                             │
│                 — Jay       │
│                             │
│          24 Sep 2026         │
└─────────────────────────────┘
```

The page should feel like a small piece of a digital book rather than a conventional social-media post.

---

# 54. Books as Collections of Pages

A Book is now primarily a collection of pages.

Example:

```text
Zindagi Ke Kuch Panne

Page 01
Page 02
Page 03
Page 04
Page 05
...
```

The author can continuously add pages.

A book can be:

- Short — 5 pages
- Medium — 30 pages
- Long — 365+ pages

There should be no requirement that a book must have chapters.

Chapters can remain an optional advanced structure for traditional writers.

---

# 55. Daily Books

A user can create a daily book.

Example:

```text
My 2026

01 Jan
📷 New Year
"New year, new beginning..."

02 Jan
☕ Morning routine
"Some mornings..."

03 Jan
🏃 Running
"5 km done."

...

24 Sep
🌇 Ahmedabad sunset
"Some evenings..."
```

This turns a year into a personal digital memory book.

---

# 56. Collaborative Books

Users should be able to invite other people to contribute pages.

Example:

```text
OUR 2026

Jay
 ├── Page 1
 ├── Page 4
 └── Page 9

Rahul
 ├── Page 2
 └── Page 7

Neha
 ├── Page 3
 └── Page 8
```

Potential collaborative books:

- Friends' memories
- Couple diary
- Family memories
- College memories
- Trip diary
- Event memories
- Group poetry
- Community collections

Roles can eventually include:

- Owner
- Contributor
- Editor
- Viewer

---

# 57. Community Books

A book can optionally be open for public contributions.

Example:

> **1000 Shayaris by 1000 People**

Anyone can submit a page.

Another example:

> **Things We Never Said**

People contribute their own page.

The owner can moderate submissions before they become part of the book.

This could become a major community feature.

---

# 58. Social Feed — Page-Based

The home feed should primarily show newly created pages.

Example:

```text
📖 Today's Pages

Jay's "Zindagi Ke Panne"

┌─────────────────────────────┐
│                             │
│       🌇 Ahmedabad Sunset   │
│                             │
│ "कुछ शामें तस्वीरों में     │
│  नहीं, यादों में अच्छी      │
│  लगती हैं।"                 │
│                             │
└─────────────────────────────┘

❤️ 82   💬 12   🔖

[Read Book]
```

Another user:

```text
Neha's "My Little Life"

☕ Morning Coffee

"Some mornings don't need
a reason."

❤️ 54   💬 8
```

The feed should make it easy to discover individual pages and then enter the complete book.

---

# 59. Page Reactions

Reactions should be lightweight.

Potential reactions:

- ❤️ Love
- ✨ Beautiful
- 😭 Emotional
- 😂 Funny
- 😍
- 🔥
- 😔
- 🤯

The initial MVP can use a simple Like/Heart reaction and expand later.

---

# 60. Page Comments

Users can comment on a page.

Example:

```text
❤️ 82

Rahul:
"This line is beautiful."

Neha:
"Reminds me of our Pune trip ❤️"
```

Comments should support:

- Reply
- Like
- Delete own comment
- Report
- Author/contributor badge

---

# 61. Add Your Own Page / Response

A social interaction can allow users to respond with their own page.

Example:

User publishes:

> "Things I learned this year..."

Another user can choose:

> **Write Your Page**

and create their own response.

This can create chains/collections around themes.

---

# 62. Remix / Add to Collection

A future feature:

> **Remix this page**

The user can create a new page inspired by the original while maintaining attribution.

This should respect content ownership and clearly distinguish original content from derivative/remixed content.

---

# 63. Page Templates

Provide minimal templates to reduce creation friction.

Examples:

### Shayari

```text
Large centered text
Small author/date
Minimal background
```

### Daily Memory

```text
Photo
Short text
Date
Mood
```

### Travel

```text
Photo
Location
Short story
Date
```

### Quote

```text
Large quote
Author/source
Minimal typography
```

### Daily Journal

```text
Date
Mood
Text
Optional photo
```

Templates should remain customizable but simple.

---

# 64. Photo-First Books

Users can create books where images are the main content.

Examples:

- My Pune Trip
- 30 Days of Sunsets
- Ahmedabad Through My Eyes
- My Running Journey

Each page can contain:

```text
Photo
↓
Short caption
↓
Date
↓
Optional location
```

---

# 65. Book Themes

Books should support visual themes.

Initial themes:

- Minimal
- Paper
- Dark
- Clean
- Photo
- Poetry

Later:

- Custom typography
- Custom background
- Custom cover
- Theme marketplace

The design should prioritize readability and avoid becoming a complicated design editor.

---

# 66. Book Cover

Every book should have a cover.

Cover can be:

- Uploaded image
- Generated minimal cover
- Photo
- Text-based cover
- AI-assisted cover later

Example:

```text
┌─────────────────────────────┐
│                             │
│       ZINDAGI KE            │
│          KUCH                │
│         PANNE                │
│                             │
│           Jay               │
│                             │
└─────────────────────────────┘
```

---

# 67. Book Sharing

Users can share:

- Individual page
- Complete book
- Book cover
- Quote/page image
- Public book link

The platform can generate beautiful share cards for social networks.

---

# 68. Book Privacy

Books should support:

### Private

Only the owner/invited contributors can see it.

### Friends / Invited

Only selected people.

### Followers

Followers can read.

### Public

Anyone can discover and read.

### Collaborative Public

Anyone can read, approved users can contribute.

---

# 69. Memory Book / Year Book

A major use case can be automatically generating a book from a user's pages.

Example:

> **My 2026**

The system organizes pages chronologically.

At the end of the year:

```text
My 2026

365 Pages
142 Photos
86 Memories
12 Contributors

[Read Book]
[Export Book]
```

This could eventually become a physical-print or PDF/EPUB product.

---

# 70. Daily Reminder / Habit Experience

Users can optionally enable:

> "Create a page today."

This is an optional reminder, not mandatory.

Possible goals:

- Daily Shayari
- Daily photo
- Daily journal
- Daily gratitude
- Daily fitness
- Daily learning

A writing streak can measure consistency.

---

# 71. Updated Product Positioning

Do NOT position the product only as:

> "Online book writing platform."

Preferred positioning:

> **"Create beautiful digital books, one page at a time."**

Alternative:

> **"Turn your everyday moments into books."**

Social positioning:

> **"Create. Share. Contribute. Build books together."**

The exact brand positioning is still an open decision.

---

# 72. Updated Core Product Model

The new conceptual model is:

```text
User
  ↓
Book
  ↓
Pages
  ↓
Social Feed
  ↓
Readers
  ↓
Reactions / Comments / Contributions
```

For collaborative books:

```text
Multiple Users
      ↓
Collaborative Book
      ↓
Multiple Pages
      ↓
Shared Memory / Story
```

---

# 73. Updated MVP

The MVP should now focus on the page-based experience.

## User

- Sign up/login
- Profile
- Follow users

## Book

- Create book
- Book cover
- Title
- Description
- Privacy
- Theme
- Add pages

## Page

- Text
- Photo
- Date
- Basic minimal styling
- Publish
- Edit/delete

## Social

- Home feed
- Discover
- Like/heart
- Comments
- Follow book
- Follow author
- Share page/book

## Reader

- Read page
- Open complete book
- Reading progress
- Library/bookmarks

## Collaboration

For MVP, support a simple:

- Invite contributor
- Contributor adds page
- Owner can remove contributor

Advanced permissions can come later.

---

# 74. Updated Phase 2

- Daily reminders
- Writing streak
- More templates
- More themes
- Polls
- Page responses
- Remix
- Public community books
- Advanced book discovery
- Book analytics
- AI writing assistant
- AI cover generation
- Year-in-review books

---

# 75. Updated Phase 3

- Paid books
- Tips
- Premium themes
- Printed physical books
- EPUB/PDF export
- Audio books
- Collaborative advanced permissions
- AI book organization
- AI translation
- Community challenges
- Creator subscriptions

---

# 76. Important Product Questions — Updated

The implementation agent must ask these before locking the product architecture:

### Core experience

1. Is the primary content a **page**, a **chapter**, or should both exist?
2. Should the MVP focus mainly on short-form visual pages rather than long-form books?
3. Is the main audience writers, everyday users, or both?
4. Should users be encouraged to create a page every day?

### Book structure

5. Can a book contain only pages, or should chapters also be supported?
6. Can a page belong to multiple books?
7. Can users reorder pages?
8. Can users insert a page between existing pages?

### Social

9. Should the home feed show full pages or previews?
10. Should users be able to create normal social posts outside books?
11. Should users follow books, authors, users, or all three?
12. Should users be able to quote/share another user's page?

### Collaboration

13. Should collaborative books be private by default?
14. Can contributors edit each other's pages?
15. Does the book owner approve every submitted page?
16. Can a public book accept contributions from anyone?

### Photos

17. How many photos can one page contain?
18. Should video be supported later?
19. Should photos be stored in Blob/Object Storage and served through a CDN?
20. Should photo metadata such as location be stored?

### Content

21. Is mature/18+ content allowed?
22. Should users be able to report pages/books?
23. Should books have content warnings?
24. Should public contributions require moderation?

### Monetization

25. Is the initial product completely free?
26. Is physical book printing eventually part of the business?
27. Should creators eventually sell books?
28. Should premium themes be monetized?

### AI

29. Should AI be part of the first release?
30. Is AI mainly for writing assistance, book design, recommendations, or all three?
31. Should users be able to generate a complete visual page from a prompt?

### Platform

32. Web only initially, or mobile app too?
33. Should reading be optimized for mobile even if writing starts on web?
34. India-first or global?
35. Which languages should be supported at launch?

---

# 77. Updated Agent Instruction

The implementation agent should use this document as the current product understanding.

The **page-first visual social book concept supersedes the earlier chapter-first assumption where the two conflict**.

The agent must:

1. Treat the page as the primary MVP content unit.
2. Treat books as collections of pages.
3. Keep the social feed page-centric.
4. Support short text + photo + minimal visual presentation.
5. Design books so they can become collaborative.
6. Avoid overbuilding traditional publishing features in the MVP.
7. Preserve a future path for chapters and long-form books.
8. Ask the product owner questions when a decision affects the core experience.
9. Separate confirmed requirements from assumptions.
10. Keep user-generated content, privacy, moderation, copyright, and abuse prevention in the architecture.
11. Keep the design minimal and content-focused.
12. Optimize for extremely low friction: **open app → create page → publish**.

The desired emotional experience is:

> **"I want to save this moment."**

rather than:

> **"I need to write a book."**
