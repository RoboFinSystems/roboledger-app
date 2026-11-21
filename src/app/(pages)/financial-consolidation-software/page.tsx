import FinalCTA from '@/components/landing/FinalCTA'
import { BOOK_PATH, REGISTER_PATH } from '@/components/landing/constants'
import {
  CardGrid,
  JsonLd,
  LINK_CLASS,
  OUTLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
  Section,
} from '@/components/product-pages/parts'
import {
  getProductPage,
  productPageJsonLd,
  productPageMetadata,
} from '@/lib/product-pages'
import Link from 'next/link'

// Every claim here is checked against docs/product/roboledger (consolidate-a-group,
// working-across-companies, keep-your-books-where-they-are) on the day it ships.

const page = getProductPage('/financial-consolidation-software')

export const metadata = productPageMetadata(page)

const drafts = [
  {
    title: 'Investment and capital',
    body: "The parent's investment eliminated against each subsidiary's capital, with an outside owner's share of that capital as noncontrolling interest.",
  },
  {
    title: 'What the companies owe each other',
    body: 'Intercompany balances taken out. A transaction is intercompany when it names another company in the group as its counterparty.',
  },
  {
    title: 'Business done with each other',
    body: "Income one company earned from another eliminated against the other's expense.",
  },
  {
    title: "Outside owners' share",
    body: "Noncontrolling interest in the month's result, at their percentage, or at the amount you give for a preferred return or a waterfall.",
  },
  {
    title: 'Equity-method companies',
    body: "Left out of the sum. The group carries the investment and the parent's share of the company's result instead.",
  },
  {
    title: 'Drafted again, never doubled',
    body: 'Each entry brings its balance to what the month needs, so an entry you post yourself counts, and drafting a month again replaces only the earlier drafts.',
  },
]

const changes = [
  {
    title: 'You buy a company',
    body: 'Add it with the day it joined and the share you bought, open its books at that date, and record the acquisition. The price above your share of its equity becomes goodwill, and the cash flow shows the purchase net of the cash that came with it.',
  },
  {
    title: 'You buy more, or sell some, and keep control',
    body: "No gain or loss in the group either way. The difference adjusts the parent's equity, and the price moves to a payment to or from the outside owners.",
  },
  {
    title: 'You sell it',
    body: "Close its last month and record the deconsolidation with the price. The group's gain or loss is worked out for you, and it is smaller than the parent's own, because the group already counted the company's results while it was a member.",
  },
]

const asks = [
  'Draft this month’s consolidating entries and tell me what you could not explain.',
  'Show me the consolidation worksheet for August.',
  'Where does the noncontrolling interest on the consolidated balance sheet come from?',
  'We sold Northside at the end of May for $62,000. Take it out of the group.',
]

export default function FinancialConsolidationSoftwarePage() {
  return (
    <>
      <JsonLd data={productPageJsonLd(page)} />
      <article>
        <div className="relative">
          <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
          <header className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-primary-400 mb-4 text-sm font-semibold tracking-wider uppercase">
              Financial consolidation
            </p>
            <h1 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
              {page.h1}
            </h1>
            <p className="mb-6 text-xl leading-relaxed text-gray-300">
              RoboLedger keeps every company in your group on its own books,
              chart and close, in one graph. Each month your AI assistant drafts
              the consolidating entries for you to review and post, and every
              number on the consolidated statements opens to the entries behind
              it.
            </p>
            <p className="text-base text-gray-400">
              Create an account, then add a graph for your group&apos;s books,
              from $99 a month by card.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href={REGISTER_PATH} className={PRIMARY_BUTTON_CLASS}>
                Create an account
              </Link>
              {/* A plain <a>: /book redirects to the scheduler on another site. */}
              <a href={BOOK_PATH} className={OUTLINE_BUTTON_CLASS}>
                Book 20 minutes
              </a>
              <Link href={page.docsPath} className={OUTLINE_BUTTON_CLASS}>
                Read the guide
              </Link>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Section title="Multi-entity accounting software: one group, one graph">
            <p>
              The company your books were created for is the group parent. Add
              each subsidiary with the share the parent holds, and it keeps its
              own books, its own chart of accounts and its own close, on the
              group&apos;s fiscal year. Customers and vendors are shared across
              the group. There is no limit on the companies in a group; the
              graph&apos;s tier decides its capacity.
            </p>
            <p>
              The share decides the treatment. Half or more is consolidated in
              full, a fifth to a half takes the equity method, and less is an
              investment at cost. Where control isn&apos;t the percentage, you
              set the treatment yourself.
            </p>
            <p>
              Every company&apos;s accounts are mapped to standard reporting
              concepts, and the group is built from those concepts, never from
              account numbers or names. So two companies with different charts
              still add up line by line.
            </p>
          </Section>

          <Section title="The consolidating entries, drafted every month">
            <p>
              Once every company has its month in the books, ask your assistant
              for the month&apos;s consolidating entries. It drafts them in the
              consolidation entity, a company in the group that holds only those
              entries, so no operating company&apos;s statements ever include
              them. You see them first, and they stay drafts until the group
              close posts them.
            </p>
            <CardGrid items={drafts} />
          </Section>

          <Section title="What the books don't explain is left for you">
            <p>
              When the parent&apos;s investment doesn&apos;t match its share of
              a subsidiary&apos;s capital, that elimination is held back and the
              difference is named, with the likely reason: distributions booked
              as income, a purchase not recorded yet, or shares bought or sold
              without an entry. When two companies disagree about what one owes
              the other, the lower amount is eliminated and the difference is
              listed.
            </p>
            <p>
              Correct the books, post the explaining entry, or close over the
              difference knowingly. The AI drafts. Your people approve.
            </p>
          </Section>

          <Section title="Consolidated financial statements, and the worksheet behind them">
            <p>
              On the group parent, the statements have four scopes: the company
              on its own; the companies summed with nothing eliminated; the
              consolidated statements; and the worksheet, with each company in
              its own column, then the sum, the adjustments and the consolidated
              total. The worksheet is where you check a consolidating entry.
            </p>
            <p>
              The group close is the consolidation entity&apos;s close. It waits
              until every company has closed the month, nothing is left
              unexplained, and the consolidated balance sheet and statement of
              changes in equity tie. Then it posts the drafts and saves the
              month&apos;s consolidated statements, which you can download as
              XBRL or share with an investor or lender as a report.
            </p>
          </Section>

          <Section title="When the group changes">
            <CardGrid items={changes} />
          </Section>

          <Section title="Several QuickBooks companies?">
            <p>
              Only the group parent&apos;s QuickBooks Online company connects,
              and nothing writes to QuickBooks until you post an entry. A
              subsidiary&apos;s books come in through its own bank feed, your
              assistant, the API, or another ledger that stays the keeper of
              that company&apos;s books. Keep your ERP and your books where they
              are today, or keep your books on RoboLedger.{' '}
              <Link
                href="/docs/keep-your-books-where-they-are"
                className={LINK_CLASS}
              >
                Keep your books where they are →
              </Link>
            </p>
          </Section>

          <Section title="What it doesn't do yet">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                A company can&apos;t move between the equity method and full
                consolidation from a date once the group has closed a month with
                it.
              </li>
              <li>Groups are flat: one parent and its companies.</li>
              <li>A company in another currency isn&apos;t translated.</li>
              <li>
                Unrealized profit on goods or assets sold within the group is an
                entry you make.
              </li>
            </ul>
          </Section>

          <Section title="Try asking">
            <ul className="list-disc space-y-2 pl-6">
              {asks.map((ask) => (
                <li key={ask}>&ldquo;{ask}&rdquo;</li>
              ))}
            </ul>
            <p>
              <Link href={page.docsPath} className={LINK_CLASS}>
                Consolidate a group of companies, step by step →
              </Link>
            </p>
          </Section>
        </div>
      </article>
      <FinalCTA />
    </>
  )
}
