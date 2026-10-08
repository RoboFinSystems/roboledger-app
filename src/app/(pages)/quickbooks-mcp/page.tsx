import FinalCTA from '@/components/landing/FinalCTA'
import { REGISTER_PATH } from '@/components/landing/constants'
import {
  getProductPage,
  productPageJsonLd,
  productPageMetadata,
} from '@/lib/product-pages'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Every claim here is checked against docs/product/roboledger (connect-your-books,
// what-claude-can-do, quickbooks-write-back) on the day it ships.

const page = getProductPage('/quickbooks-mcp')

export const metadata = productPageMetadata(page)

const MCP_URL = 'https://api.robosystems.ai/v1/mcp/roboledger'

const clients: { name: string; how: ReactNode; code?: string }[] = [
  {
    name: 'Claude (claude.ai and Claude Desktop)',
    how: 'Customize → Connectors → Add → Add custom connector, and paste the address.',
  },
  {
    name: 'Claude Code',
    how: 'Run this, then /mcp to sign in.',
    code: `claude mcp add --transport http roboledger ${MCP_URL}`,
  },
  {
    name: 'ChatGPT',
    how: 'Turn on developer mode, then Settings → Connectors → Create, and paste the address.',
  },
  {
    name: 'Cursor, VS Code and other MCP clients',
    how: "Add the address to the client's MCP configuration. The client runs the sign-in for you.",
    code: `"roboledger": { "url": "${MCP_URL}" }`,
  },
]

const capabilities = [
  {
    title: 'Analyze',
    body: 'Ask why gross margin dropped or which vendors grew fastest. It reads your statements, trial balance, journal entries, customers and vendors, as of your last sync. Reading uses no credits.',
  },
  {
    title: 'Report',
    body: 'Build the balance sheet, income statement, cash flow and statement of equity for a period, then download them as XBRL or share them with another graph.',
  },
  {
    title: 'Plan',
    body: 'Project scenarios like hiring or a new contract month by month from your actuals. A forecast is calculated, not generated.',
  },
  {
    title: 'Compare',
    body: 'Add a second connection at https://api.robosystems.ai/v1/mcp and choose the SEC filings graph, then put your margins and growth next to public companies in your industry. It is a separate subscription.',
  },
  {
    title: 'Close',
    body: 'When you trust the numbers, the month-end entries arrive drafted for review, and you see what will be written to QuickBooks before anything posts.',
  },
]

// `wrap` breaks a lone URL across lines on a phone rather than hiding its end.
function Code({ children, wrap }: { children: string; wrap?: boolean }) {
  return (
    <pre
      className={`rounded-lg border border-gray-800 bg-zinc-950 px-4 py-3 text-sm text-gray-200 ${wrap ? 'break-all whitespace-pre-wrap' : 'overflow-x-auto'}`}
    >
      <code>{children}</code>
    </pre>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-gray-900 py-14">
      <h2 className="font-heading mb-6 text-3xl font-bold text-white">
        {title}
      </h2>
      <div className="space-y-4 text-lg leading-relaxed text-gray-300">
        {children}
      </div>
    </section>
  )
}

export default function QuickBooksMcpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productPageJsonLd(page)).replace(
            /</g,
            '\\u003c'
          ),
        }}
      />
      <article>
        <div className="relative">
          <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
          <header className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-primary-400 mb-4 text-sm font-semibold tracking-wider uppercase">
              QuickBooks MCP
            </p>
            <h1 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
              {page.h1}
            </h1>
            <p className="mb-8 text-xl leading-relaxed text-gray-300">
              RoboLedger syncs QuickBooks Online into a ledger your AI assistant
              can query, with every account mapped to standard reporting
              concepts. Add one address to your AI client and ask about your
              books.
            </p>
            <Code wrap>{MCP_URL}</Code>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={REGISTER_PATH}
                className="from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 rounded-lg bg-linear-to-r px-6 py-3 text-center font-medium text-white shadow-lg transition-all"
              >
                Get Started
              </Link>
              <Link
                href={page.docsPath}
                className="rounded-lg border border-gray-600 px-6 py-3 text-center font-medium text-white transition-all hover:border-gray-500 hover:bg-white/5"
              >
                Read the setup guide
              </Link>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Section title="Connect QuickBooks to Claude or ChatGPT in three steps">
            <ol className="list-decimal space-y-4 pl-6">
              <li>
                <strong className="text-white">
                  Create an account and a graph.
                </strong>{' '}
                A graph is your company&apos;s own database. Its books, reports
                and plans live in it, and no other customer&apos;s data does.
              </li>
              <li>
                <strong className="text-white">
                  Connect QuickBooks Online.
                </strong>{' '}
                In RoboLedger, open Entity → Connections and sign in to Intuit
                with an admin account. The first sync brings over your full
                history and maps your chart of accounts to reporting concepts.
              </li>
              <li>
                <strong className="text-white">
                  Add the MCP server to your AI client.
                </strong>{' '}
                The first time a tool runs, you sign in to RoboSystems and
                choose the graph to connect.
              </li>
            </ol>
            <div className="space-y-6 pt-4">
              {clients.map((client) => (
                <div key={client.name}>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {client.name}
                  </h3>
                  <p className="mb-2">{client.how}</p>
                  {client.code && <Code>{client.code}</Code>}
                </div>
              ))}
            </div>
          </Section>

          <Section title="What your AI can do with QuickBooks data">
            <dl className="grid gap-6 sm:grid-cols-2">
              {capabilities.map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-gray-800 bg-zinc-950/60 p-5"
                >
                  <dt className="mb-2 font-semibold text-white">{c.title}</dt>
                  <dd className="text-base text-gray-400">{c.body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="RoboLedger vs Intuit's QuickBooks MCP server and Claude connector">
            <p>
              Intuit ships its own QuickBooks MCP server and a Claude connector.
              Both are built for running the business: creating invoices,
              customers and payments. Use them for that.
            </p>
            <p>
              RoboLedger does a different job. It maps your chart of accounts to
              reporting concepts, so a statement, a forecast or a comparison
              with a public company means the same thing from one period to the
              next, and you can open any answer down to the facts behind it.
            </p>
            <p>
              <Link
                href="/blog/quickbooks-mcp"
                className="text-primary-400 hover:text-primary-300"
              >
                Read the full comparison →
              </Link>
            </p>
          </Section>

          <Section title="Nothing writes to QuickBooks until you post">
            <p>
              Connecting, syncing, asking questions, building reports and
              running forecasts never write to QuickBooks. Only entries
              RoboLedger posts do: the entries drafted for a month when you
              close it, or a single entry you agree on. Before a close, you see
              which entries will be written.
            </p>
            <p>
              <Link
                href="/docs/quickbooks-write-back"
                className="text-primary-400 hover:text-primary-300"
              >
                What gets written back, and when →
              </Link>
            </p>
          </Section>

          <Section title="What it needs">
            <ul className="list-disc space-y-2 pl-6">
              <li>QuickBooks Online, and admin permissions in the company.</li>
              <li>Books kept in US dollars.</li>
              <li>
                Your books sync once a day on their own. For anything more
                recent, press Sync Now or ask your assistant to sync.
              </li>
            </ul>
          </Section>
        </div>
      </article>
      <FinalCTA />
    </>
  )
}
