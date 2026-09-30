import { Link } from "react-router-dom";

/**
 * Privacy policy.
 *
 * Google requires this at a verifiable public URL before it will let an OAuth
 * client leave "testing", so it has to render as real content at /privacy — not
 * a placeholder, and not behind the auth guard. Google fetches it anonymously.
 *
 * Every claim below is written from what the code actually does. If a route or
 * model changes, this file has to change with it; a policy that has drifted from
 * the behaviour is worse than none, because it is a false statement published
 * under the app's name.
 */

const CONTACT_EMAIL = "jkrathod2601@gmail.com";

const SECTIONS = [
  {
    heading: "What Folio is",
    body: [
      "Folio is a writing space. Drafts become pages, and pages become books. It is operated by an individual, not a company, and is provided as-is with no account fee.",
    ],
  },
  {
    heading: "What we collect",
    body: [
      "Folio does not ask you to create a password. Sign-in is handled by Google through OAuth 2.0, and we receive only the profile fields you approve on Google's consent screen:",
    ],
    list: [
      "Your Google account identifier, used to recognise you on later sign-ins",
      "Your email address, used as your Folio username and to identify your account",
      "Your display name",
      "Your profile photo URL, used as your author portrait",
      "Whether Google has verified your email address",
    ],
  },
  {
    heading: "What you write",
    body: [
      "The books, pages, and story notes you write are stored so they can be shown back to you and, where you choose to make them public, to other readers. Draft pages are private to you unless you explicitly publish them. Page text is never sent to Google or any third party.",
    ],
  },
  {
    heading: "Sessions and security data",
    body: [
      "To keep you signed in and to protect your account, Folio stores a session record per sign-in: a hashed token, its creation and expiry time, your browser's user-agent string, and your IP address. Access tokens are short-lived and held in your browser's memory only, never in local storage where a script could read them. A refresh token is held in an httpOnly cookie that JavaScript cannot access.",
    ],
  },
  {
    heading: "Cookies",
    body: [
      "Folio sets two cookies, both required for sign-in and both httpOnly so no script can read them: a refresh token that keeps you signed in, and a short-lived state cookie used once to protect the OAuth handshake against forgery. No advertising, analytics, or third-party tracking cookies are used.",
    ],
  },
  {
    heading: "Who can see your work",
    body: [
      "By default nothing you write is visible to anyone else. A book is public only if you change its visibility to public and its status to published; until then it is readable only by you. Administrators can access accounts for moderation and support, and may remove content that violates these terms.",
    ],
  },
  {
    heading: "What we do not do",
    list: [
      "We do not sell your personal information.",
      "We do not share your manuscript text with third parties.",
      "We do not run advertising or behavioural profiling.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Your account and its content are kept until you ask us to delete them. Deleted books and pages are removed from the database. Deleting your account removes your profile, your books and pages, and all active sessions.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can access and export your data at any time by writing to us. You can ask us to correct inaccurate information, or to delete your account and everything in it. Because sign-in is delegated to Google, changing your name or photo at Google changes it at Folio on your next sign-in.",
    ],
  },
  {
    heading: "Children",
    body: [
      "Folio is not directed at children under 13, and we do not knowingly collect information from them.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "If this policy changes materially we will update the date below. Continuing to use Folio after a change means you accept the revised policy.",
    ],
  },
];

const LAST_UPDATED = "30 September 2026";

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-code text-xs uppercase tracking-widest text-zinc-400">
        Legal
      </p>
      <h1 className="mt-3 font-heading text-3xl text-zinc-950">Privacy Policy</h1>
      <p className="mt-2 font-code text-xs uppercase tracking-widest text-zinc-500">
        Last updated {LAST_UPDATED}
      </p>

      <div className="mt-10 space-y-9">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl text-zinc-950">
              {section.heading}
            </h2>
            {section.body?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 font-body text-sm leading-relaxed text-zinc-700"
              >
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="mt-3 space-y-2">
                {section.list.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 font-body text-sm leading-relaxed text-zinc-700"
                  >
                    <span aria-hidden="true" className="text-zinc-400">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 border-t border-zinc-200 pt-8">
        <h2 className="font-heading text-xl text-zinc-950">Contact</h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-zinc-700">
          Questions, requests, or corrections can be sent to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-code text-xs underline underline-offset-4 hover:opacity-70"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="mt-6 font-body text-sm text-zinc-600">
          <Link
            to="/"
            className="font-code text-xs uppercase tracking-wider underline underline-offset-4 hover:opacity-70"
          >
            Back to the feed
          </Link>
        </p>
      </section>
    </div>
  );
}

export { PrivacyPage, LAST_UPDATED, CONTACT_EMAIL };