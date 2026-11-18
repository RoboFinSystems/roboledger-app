import { BOOK_PATH, HARBINGER_URL } from './constants'
import FindATime from './FindATime'
import FloatingElementsVariant from './FloatingElementsVariant'

// Harbinger FinLab runs the Finance AI Deployment (renamed from "Pilot" on 2026-11-16, which
// read as both a proof of concept and a copilot): RoboSystems where the customer chooses, on
// their books, with three agent workflows, in two to three weeks, at a fixed fee. Hosting is
// always RoboSystems', never Harbinger's: the RoboSystems managed platform, a Dedicated
// Deployment RoboSystems runs, or the customer's own cloud, where their team deploys it with
// Joey on a screenshare they control. The workflows run on API keys they issue and can
// revoke; nobody from Harbinger signs in to or posts on their books (its MSA, 2.2 and 4.1).
// The wording follows the offer, fee and ledgers lines in the vault's
// gtm/content/positioning.md, which keep the offer speaker-neutral. The old offers
// (implementation and training, referrals to a practice) are listed in
// __tests__/retired-phrases.test.ts, which fails if they come back.
const points = [
  {
    title: 'The knowledge graph we build',
    body: 'Your ledger, mapped so every number traces to its entry, with workspaces beside the books where your agents add their own structure. At the top of the price range, one data source from another of your systems is modelled from your own schema as a graph of its own.',
  },
  {
    title: 'Three working workflows',
    body: 'Variance explanation, a close checklist and a peer benchmark, in your MCP client.',
  },
  {
    title: 'Your deployment, your keys',
    body: 'In your cloud, your team deploys it with Joey on a screenshare you control; on the managed platform or a Dedicated Deployment, RoboSystems runs it. Either way the workflows run on API keys you issue and can revoke.',
  },
  {
    title: 'Never the pen',
    body: 'Nobody from Harbinger posts, approves or closes a period on your books, or signs in to them. The AI drafts. Your people approve.',
  },
  {
    title: 'Proof',
    body: "Our own companies' books are kept on it.",
  },
  {
    title: 'You keep everything we build',
    body: 'Open source (Apache 2.0 and MIT). You keep the code and the data whatever happens to any vendor, including us.',
  },
]

export default function HarbingerSection() {
  return (
    <section
      id="harbinger"
      className="relative overflow-hidden bg-black py-16 sm:py-24"
    >
      <div className="from-secondary-900/20 via-primary-900/10 absolute inset-0 bg-linear-to-br to-black"></div>
      <FloatingElementsVariant variant="platform" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-800 bg-linear-to-br from-zinc-900 to-black p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="bg-secondary-500/15 text-secondary-300 mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                The Finance AI Deployment
              </div>
              <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
                Finance AI that ties to your books, in two to three weeks
              </h2>
              <p className="mb-4 text-base leading-relaxed text-gray-300">
                <strong className="text-white">Harbinger FinLab</strong> runs
                the Finance AI Deployment: RoboSystems where you choose (the
                RoboSystems managed platform, a Dedicated Deployment RoboSystems
                runs, or your own cloud), on your books, with three working
                agent workflows, in two to three weeks, at a fixed fee.
                It&apos;s for the person who owns the numbers (a CFO,
                controller, or a fractional CFO or CPA firm for a client) and
                the person who wires AI to them. Built by an inactive CPA and
                ex-Workiva knowledge engineer.
              </p>
              <p className="mb-4 text-sm leading-relaxed text-gray-400">
                $7,500 to $10,000, fixed by scope: half up front, half at
                handover. Hosting is separate: from $99 a month on the managed
                platform, Dedicated quoted, or free to self-host.
              </p>
              <p className="mb-6 text-sm leading-relaxed text-gray-400">
                QuickBooks connects directly; any other ledger comes in through
                the API or a file.
              </p>
              {/* A plain <a>: /book redirects to the scheduler on another site. */}
              <a
                href={BOOK_PATH}
                className="from-secondary-500 to-primary-500 shadow-secondary-500/25 hover:shadow-secondary-500/40 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-6 py-3 text-base font-medium text-white shadow-xl transition-all duration-300"
              >
                Book 20 minutes
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <FindATime className="mt-3" />
              <a
                href={HARBINGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 mt-4 inline-block text-sm font-medium"
              >
                About Harbinger FinLab
              </a>
            </div>

            <div className="space-y-3">
              {points.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-gray-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="text-secondary-400 mt-0.5 h-5 w-5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {p.title}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-400">{p.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
