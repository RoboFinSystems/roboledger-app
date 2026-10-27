import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  HARBINGER_URL,
  QUICKBOOKS_AFFILIATE_URL,
  ROBOSYSTEMS_URL,
} from './constants'

// Every answer holds to gtm/plan.md §5: only the group parent's QuickBooks company
// connects; the assistant drafts the consolidating entries and a person posts them; what
// isn't built (other currencies, nested groups) is said plainly. The price is the
// Standard plan on robosystems.ai/pricing, per graph, and a group shares one graph.
const faqs: { q: string; a: ReactNode }[] = [
  {
    q: 'Can it consolidate a group of companies?',
    a: (
      <>
        Yes. A holding company and its LLCs, a franchise operator, a founder
        with three companies: each company keeps its own books, chart and close,
        and the group is built from shared reporting concepts, never from
        account names. Every month your AI drafts the consolidating entries (the
        parent&apos;s investment against each subsidiary&apos;s capital, what
        the companies owe and bill each other, an outside owner&apos;s share)
        and a person posts them. Equity-method companies, acquisitions, changes
        in ownership and a company sold out of the group are handled too. Not
        yet: companies in another currency, or a group inside a group.{' '}
        <Link
          href="/docs/consolidate-a-group"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          How consolidation works
        </Link>
      </>
    ),
  },
  {
    q: 'Do I have to leave QuickBooks?',
    a: (
      <>
        No. RoboLedger syncs the group parent&apos;s{' '}
        <a
          href={QUICKBOOKS_AFFILIATE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          QuickBooks
        </a>{' '}
        chart of accounts and transactions. The other companies start from their
        opening balance sheet and come in through a bank feed, the API or a
        file. Reading, analysis, and planning write nothing back; approved
        entries go back to QuickBooks only when you post them.
      </>
    ),
  },
  {
    q: 'Where does my financial data live?',
    a: (
      <>
        In your own knowledge graph on the RoboSystems platform. RoboLedger is
        open source, so you can inspect exactly how every number is produced,
        and you can fork it and take it in-house whenever you want.
      </>
    ),
  },
  {
    q: 'Do I need to know XBRL or US-GAAP?',
    a: (
      <>
        No. AI Auto-Map proposes the US-GAAP mapping for each company&apos;s
        chart of accounts with confidence scores, and the rule engine validates
        every entry before you lock a period. You review and adjust, and you can
        add, rename, move or retire accounts in the app. The taxonomy work
        happens for you.
      </>
    ),
  },
  {
    q: 'What does the AI actually do?',
    a: (
      <>
        It answers questions about your books in plain English, opens any number
        down to the facts behind it, rolls plans forward, and compares you to
        public companies. When you&apos;re ready, it also sorts bank lines into
        accounts, drafts the month&apos;s schedule entries and the group&apos;s
        consolidating entries, and proposes posting rules. You stay in control
        at every step: previews of what would post, balanced-entry checks, and
        nothing posts until a person approves it.
      </>
    ),
  },
  {
    q: 'Can I forecast, or is this only historical accounting?',
    a: (
      <>
        You can plan forward. Once you&apos;ve closed a month, the Plan surface
        puts your monthly statements and a scenario&apos;s assumptions in one
        grid spanning the actuals/forecast seam, so the forecast is driven by
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
        Yes, deliberately. Every write operation on the platform becomes an MCP
        tool the day it ships, while screens follow where they earn their place.
        Authoring a forecast scenario and defining a new metric run from Claude,
        ChatGPT, or any MCP client today without a dedicated form in the app. A
        new posting rule is written by your AI too, and waits in Posting Rules
        until a person approves it. Anything you drive that way lands in the
        same ledger and shows up on the same screens.
      </>
    ),
  },
  {
    q: 'I look after several clients. Can I see them all here?',
    a: (
      <>
        Yes. Each client gets its own isolated graph (a client with several
        companies keeps them together in one), and you switch between them from
        one account. In your AI chat, add the RoboLedger connector once per
        graph and ask across all of them. It&apos;s built for fractional CFOs,
        controllers, and firms who look after more than one company.{' '}
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
        $99 a month per graph on the RoboSystems Standard plan, and a
        group&apos;s companies share one graph. Comparing against public
        companies adds the SEC subscription. Create an account, provision a
        graph with RoboLedger enabled, connect your books and ask your AI the
        first question. It&apos;s open source with no outside investors, so
        nobody can reprice it or shut it down on you.{' '}
        <a
          href={`${ROBOSYSTEMS_URL}/pricing`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          See plans
        </a>
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
