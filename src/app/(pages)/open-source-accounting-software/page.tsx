import FinalCTA from '@/components/landing/FinalCTA'
import {
  BOOK_PATH,
  GITHUB_URL,
  REGISTER_PATH,
  ROBOSYSTEMS_URL,
} from '@/components/landing/constants'
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

// Every claim here is checked against docs/product/roboledger (your-books-and-your-data,
// keep-your-books-where-they-are, consolidate-a-group) and the self-hosting pages of
// docs/technical on the day it ships. Other open-source tools are compared by shape and
// never named (vault: gtm/content/voice.md).

const page = getProductPage('/open-source-accounting-software')

export const metadata = productPageMetadata(page)

const PLATFORM_REPO_URL = 'https://github.com/RoboFinSystems/robosystems'

const books = [
  {
    title: 'Close',
    body: 'Month by month, with schedules drafting depreciation, amortization and prepaids, and reconciliations that can hold the close until they tie.',
  },
  {
    title: 'Consolidation',
    body: 'Several companies in one group, each on its own books, with the consolidating entries drafted every month.',
  },
  {
    title: 'Bank feeds',
    body: 'Transactions land for you to classify, with suggestions that learn from what you committed before.',
  },
  {
    title: 'Reports and forecasts',
    body: 'Balance sheet, income statement, cash flow and equity, downloadable as XBRL, and forecasts calculated from your actuals.',
  },
]

const takeaways = [
  {
    title: 'Reports',
    body: 'Download as holon, Tavi or XBRL 2.1 files. The holon is the complete one.',
  },
  {
    title: 'Ledger records',
    body: 'Journal entries, accounts and transactions, read row by row over the API.',
  },
  {
    title: 'The whole database',
    body: "Graph admins download the graph's database as a backup.",
  },
  {
    title: 'Plans and series',
    body: 'Explorer series and plan scenarios download as CSV or JSON.',
  },
]

export default function OpenSourceAccountingSoftwarePage() {
  return (
    <>
      <JsonLd data={productPageJsonLd(page)} />
      <article>
        <div className="relative">
          <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
          <header className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-primary-400 mb-4 text-sm font-semibold tracking-wider uppercase">
              Open source accounting
            </p>
            <h1 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
              {page.h1}
            </h1>
            <p className="mb-6 text-xl leading-relaxed text-gray-300">
              RoboLedger is the general ledger built on RoboSystems, the
              open-source knowledge graph for finance. You keep the code and the
              data whatever happens to any vendor, including us. Apache 2.0 for
              the platform and this app, MIT for the clients.
            </p>
            <p className="text-base text-gray-400">
              Built by an ex-Workiva principal financial knowledge engineer and
              inactive CPA. Our own companies&apos; books are kept on it.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href={REGISTER_PATH} className={PRIMARY_BUTTON_CLASS}>
                Create an account
              </Link>
              {/* A plain <a>: /book redirects to the scheduler on another site. */}
              <a href={BOOK_PATH} className={OUTLINE_BUTTON_CLASS}>
                Book 20 minutes
              </a>
              <a href={PLATFORM_REPO_URL} className={OUTLINE_BUTTON_CLASS}>
                Read the code
              </a>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Section title="A full accounting system, as a knowledge graph">
            <p>
              Every transaction is recorded as an event with its date, its
              amount, its counterparty and where it came from, and every account
              is mapped to a standard reporting concept. That makes the books a
              knowledge graph your AI assistant reads over MCP: Claude, ChatGPT
              or any MCP client. Every number opens to the entries behind it.
            </p>
            <CardGrid items={books} />
          </Section>

          <Section title="Where it fits among open source accounting tools">
            <p>
              Most open-source accounting software comes in one of two shapes: a
              bookkeeping app for one company&apos;s books, or a business suite
              where accounting is one module beside invoicing, inventory and
              payroll.
            </p>
            <p>
              RoboLedger is made for the AI that reads the books and the people
              who approve what it drafts. It runs no payroll and tracks no
              inventory; if you need those, the suites do them. What it adds is
              the ledger as structured, traceable data, several companies in one
              group, and your numbers beside public companies&apos; filings.
            </p>
          </Section>

          <Section title="A QuickBooks alternative, or a layer beside it">
            <p>
              Keep your ERP and your books where they are today, or keep your
              books on RoboLedger. Either way, your AI works from a knowledge
              graph of them.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">QuickBooks Online</strong>{' '}
                connects directly and syncs daily. Nothing writes to QuickBooks
                until you post an entry.
              </li>
              <li>
                <strong className="text-white">Another ledger or an ERP</strong>{' '}
                sends its journal through the API, and nothing is ever written
                back to it.
              </li>
              <li>
                <strong className="text-white">RoboLedger itself</strong> keeps
                the books, with a bank feed bringing in transactions to
                classify.
              </li>
            </ul>
            <p>
              <Link
                href="/docs/keep-your-books-where-they-are"
                className={LINK_CLASS}
              >
                Keep your books where they are →
              </Link>
            </p>
          </Section>

          <Section title="Self-hosted accounting software, or let us run it">
            <p>
              Run it in your cloud, on your own server, or on the managed
              platform from $99 a month by card. Point its AI at the model you
              choose: Claude, ChatGPT or any MCP client, or, when you host it
              yourself, an open-weight model on your own hardware. Your data
              trains no one&apos;s model.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <a
                  href={`${ROBOSYSTEMS_URL}/docs/technical/self-hosting-on-a-server`}
                  className={LINK_CLASS}
                >
                  Self-hosting on a server →
                </a>
              </li>
              <li>
                <a
                  href={`${ROBOSYSTEMS_URL}/docs/technical/self-hosted-ai-models`}
                  className={LINK_CLASS}
                >
                  Self-hosted AI models →
                </a>
              </li>
              <li>
                <a href={GITHUB_URL} className={LINK_CLASS}>
                  This app&apos;s code on GitHub →
                </a>
              </li>
            </ul>
          </Section>

          <Section title="Take your books with you">
            <CardGrid items={takeaways} />
            <p>
              <Link href={page.docsPath} className={LINK_CLASS}>
                Your books and your data →
              </Link>
            </p>
          </Section>

          <Section title="What it doesn't do">
            <ul className="list-disc space-y-2 pl-6">
              <li>Payroll or inventory.</li>
              <li>
                Several currencies in one group: a company in another currency
                isn&apos;t translated.
              </li>
            </ul>
          </Section>
        </div>
      </article>
      <FinalCTA />
    </>
  )
}
