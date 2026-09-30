import { Link } from "react-router-dom";
import { CONTACT_EMAIL, LAST_UPDATED } from "@/pages/PrivacyPage";

/**
 * Terms of service.
 *
 * Google requires this at a verifiable public URL alongside the privacy policy
 * before it will let an OAuth client leave "testing", so it renders as real
 * content at /terms — not a placeholder, and not behind the auth guard. Google
 * fetches it anonymously.
 *
 * Every claim below is written from what the code actually does, on the same
 * terms as PrivacyPage. A policy that has drifted from the behaviour is worse
 * than none, because it is a false statement published under the app's name.
 *
 * The last-updated date and contact address are imported from PrivacyPage so the
 * two documents cannot disagree about who runs Folio or when they changed.
 */

const SECTIONS = [
  {
    heading: "Accepting these terms",
    body: [
      "By creating a Folio account or signing in with Google, you agree to these terms. If you do not agree, do not use Folio.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "Folio does not issue passwords. Your account is your Google account, recognised by the identifier Google returns to us. You are responsible for activity that happens under your account, and you must be old enough to hold a Google account in your country.",
      "One person, one account. Creating additional accounts to evade a limit, to evade a suspension, or to inflate read counts is a breach of these terms.",
    ],
  },
  {
    heading: "What you keep",
    body: [
      "The books, pages, and story notes you write remain yours. Folio claims no ownership of your writing and no licence to it beyond the narrow permission needed to store your work and show it back to you, and to show it to other readers where you have chosen to publish it.",
    ],
  },
  {
    heading: "What we ask of you",
    list: [
      "Write only work you have the right to publish, and only about subjects you have the right to write about.",
      "Do not upload content that is unlawful, that infringes someone else's copyright or privacy, or that harasses or defames another person.",
      "Do not attempt to disrupt the service, probe it without permission, scrape it at volume, or circumvent rate limits and access controls.",
      "Do not impersonate another author, and do not misrepresent the origin of work you publish.",
      "Do not use Folio to distribute malware, or to send unsolicited bulk messages or promotions through any feature of the service.",
    ],
  },
  {
    heading: "Public work",
    body: [
      "Anything you publish is public and readable by anyone, with no account required. Publishing is a deliberate act, so check a page or book before you set it public, and change it back to private if you change your mind. Once a page has been read, quoted, or bookmarked by someone else, a copy may persist outside Folio's control, and we cannot promise to unring that bell.",
    ],
  },
  {
    heading: "Moderation",
    body: [
      "Administrators may remove content or suspend accounts that break these terms, and may do so without prior notice where the content is unlawful or the account is being used to harass. Where it is fair to do so, we will tell you why.",
    ],
  },
  {
    heading: "Availability",
    body: [
      "Folio is provided as-is. We aim to keep it running, but we do not guarantee that it will be available, error-free, or uninterrupted, and we may change or withdraw features. We may also discontinue Folio; if we do, we will give reasonable notice and an opportunity to export your work first.",
    ],
  },
  {
    heading: "Ending your account",
    body: [
      "You can close your account and delete your books, pages, and sessions at any time by writing to us. We will action a deletion request, and you can stop using the service at any time without deleting it.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "If these terms change materially we will update the date below. Continuing to use Folio after a change means you accept the revised terms. If you do not accept them, you can close your account.",
    ],
  },
  {
    heading: "No warranty, and liability",
    body: [
      "Folio is a personal writing tool provided by an individual, not a company. To the fullest extent the law allows, Folio is provided without warranties of any kind, express or implied.",
      "To the fullest extent the law allows, the operator of Folio is not liable for indirect or consequential loss, or for any loss of data, arising from your use of the service. Nothing in these terms limits liability that cannot lawfully be limited.",
    ],
  },
];

function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-code text-xs uppercase tracking-widest text-zinc-400">
        Legal
      </p>
      <h1 className="mt-3 font-heading text-3xl text-zinc-950">Terms of Service</h1>
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
          Questions about these terms can be sent to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-code text-xs underline underline-offset-4 hover:opacity-70"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-sm text-zinc-600">
          <Link
            to="/privacy"
            className="font-code text-xs uppercase tracking-wider underline underline-offset-4 hover:opacity-70"
          >
            Privacy Policy
          </Link>
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

export { TermsPage };
