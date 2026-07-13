import type { ReactNode } from 'react'
import { HARBINGER_URL } from './constants'

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: 'Do I have to leave QuickBooks?',
    a: (
      <>
        No. RoboLedger syncs your QuickBooks chart of accounts and transactions
        and can write approved entries back to QuickBooks when you close. It's
        an AI layer on top of your books, not a replacement for them.
      </>
    ),
  },
  {
    q: 'Where does my financial data live?',
    a: (
      <>
        In your own knowledge graph on the RoboSystems platform. RoboLedger is
        open source, so you can inspect exactly how every number is produced —
        and you can fork it and take it in-house whenever you want.
      </>
    ),
  },
  {
    q: 'Do I need to know XBRL or US-GAAP?',
    a: (
      <>
        No. AI Auto-Map proposes the US-GAAP mapping for your chart of accounts
        with confidence scores, and the rule engine validates every entry before
        you lock a period. You review and adjust — the taxonomy work happens for
        you.
      </>
    ),
  },
  {
    q: 'What does the AI actually do?',
    a: (
      <>
        It triages every transaction in the inbox, proposes account mappings,
        and answers questions about your books in natural language. You stay in
        control at every step — one-click approve/reject, dry-run previews of
        what would post, and balanced-entry checks before anything commits.
      </>
    ),
  },
  {
    q: 'I keep books for several companies — can I manage them all here?',
    a: (
      <>
        Yes. Each company&apos;s books live in their own isolated graph —
        connect QuickBooks per company, close each period independently, and
        switch between them from one account. It&apos;s built for accountants
        and bookkeepers who run more than one set of books.
      </>
    ),
  },
  {
    q: 'How do I get started, and what does it cost?',
    a: (
      <>
        Create an account, then provision a graph on the RoboSystems platform —
        enabling RoboLedger gives you access to this app. Plans and provisioning
        live on the RoboSystems side; once you've enabled RoboLedger, connect
        QuickBooks and you're closing your books in hours, not days.
      </>
    ),
  },
  {
    q: "What if I'd rather someone just did my close?",
    a: (
      <>
        That's{' '}
        <a
          href={HARBINGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Harbinger FinLab
        </a>{' '}
        — the same open platform, run for you by a team of accountants: AI
        drafts, a human controller signs off.
      </>
    ),
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="relative bg-zinc-950 py-16 sm:py-24">
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
            Questions, answered
          </h2>
          <p className="text-base text-gray-400">
            The things finance teams ask before they connect their books.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-gray-800 bg-linear-to-br from-zinc-900 to-black p-5 [&_svg]:open:rotate-45"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="font-medium text-white">{f.q}</span>
                <svg
                  className="text-primary-400 h-5 w-5 shrink-0 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
