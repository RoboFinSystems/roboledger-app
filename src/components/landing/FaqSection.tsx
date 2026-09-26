import type { ReactNode } from 'react'
import { HARBINGER_URL, QUICKBOOKS_AFFILIATE_URL } from './constants'

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: 'Do I have to leave QuickBooks?',
    a: (
      <>
        No. RoboLedger syncs your{' '}
        <a
          href={QUICKBOOKS_AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          QuickBooks
        </a>{' '}
        chart of accounts and transactions. Reading, analysis, and planning
        write nothing back; approved entries go back to QuickBooks only when you
        post them. It's an AI layer on top of your books, not a replacement for
        them.
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
        It answers questions about your books in plain English, opens any number
        down to the facts behind it, rolls plans forward, and compares you to
        public companies. When you&apos;re ready, it also triages each
        transaction in the inbox and drafts the close. You stay in control at
        every step — one-click approve/reject, dry-run previews of what would
        post, and balanced-entry checks before anything commits.
      </>
    ),
  },
  {
    q: 'Can I forecast, or is this only historical accounting?',
    a: (
      <>
        You can plan forward. Once you&apos;ve closed a month, the Plan surface
        puts your monthly statements and a scenario&apos;s assumptions in one
        grid spanning the actuals/forecast seam — so the forecast is driven by
        the same ledger the close produced, not a spreadsheet copied out of it.
        Scenarios are authored from your AI assistant over MCP today; the in-app
        editor is on the way.
      </>
    ),
  },
  {
    q: 'Are there things my AI assistant can do that the app cannot?',
    a: (
      <>
        Yes — deliberately. Every write operation on the platform becomes an MCP
        tool the day it ships, while screens follow where they earn their place.
        Authoring a forecast scenario, defining a new metric, and writing an
        event-handler rule all run from Claude, ChatGPT, or any MCP client today
        without a dedicated form in the app. Anything you drive that way lands
        in the same ledger and shows up on the same screens.
      </>
    ),
  },
  {
    q: 'I look after several companies. Can I see them all here?',
    a: (
      <>
        Yes. Each company&apos;s books live in their own isolated graph —
        connect QuickBooks per company and switch between them from one account.
        In your AI chat, add the RoboLedger connector once per company and ask
        across all of them. It&apos;s built for fractional CFOs, controllers,
        and firms who look after more than one company.{' '}
        <a
          href={HARBINGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Harbinger FinLab
        </a>{' '}
        walks you through your first client on a screenshare and trains your
        staff, so the second client is a playbook, not a project.
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
        QuickBooks and ask your AI the first question. Nothing writes back until
        you post an entry.
      </>
    ),
  },
  {
    q: "What if we don't have anyone to run it?",
    a: (
      <>
        RoboLedger is run by your own accountant, bookkeeper or fractional CFO,
        working from the AI chat they already use. If you don&apos;t have one
        yet,{' '}
        <a
          href={HARBINGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Harbinger FinLab
        </a>{' '}
        will point you to a practice that runs RoboLedger. Harbinger implements
        and trains; it never keeps anyone&apos;s books.
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
