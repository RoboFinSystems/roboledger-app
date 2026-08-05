import Image from 'next/image'
import FloatingElementsVariant from './FloatingElementsVariant'

/**
 * The agent-first section: capabilities that ship through MCP before they
 * ship as a screen.
 *
 * Every tool named here is a real, registered MCP tool on a writable
 * roboledger graph — verified against the backend's tool registry, not
 * aspirational. Write operations declared as `OperationSpec`s are
 * auto-generated into MCP tools by the registrar, which is *why* the agent
 * surface runs ahead of the UI: a new operation is callable by Claude the
 * moment it's registered, whereas a screen has to be designed and built.
 *
 * Keep this list honest. Before adding a row, confirm the tool is actually
 * registered (an `OperationSpec(name=...)`, or a hand-written tool in
 * `middleware/mcp/tools/`) and that the app genuinely has no UI input for
 * it — several report operations, for instance, are plain REST routes and
 * are NOT MCP tools, and schedules ARE authorable in the Closing Book.
 */

const capabilities: { title: string; blurb: string; tools: string[] }[] = [
  {
    title: 'Author a forecast scenario',
    blurb:
      'Name the scenario, set the horizon and base period, assert the driver levers, then derive the forward slice. The Plan grid picks it up on the next load.',
    tools: ['create-information-block', 'compute-forecast'],
  },
  {
    title: 'Define a new metric',
    blurb:
      'Declare a metric block and its operands once; the Block Explorer computes and charts its standing time series from then on.',
    tools: ['create-information-block', 'compute-metrics'],
  },
  {
    title: 'Write an event-handler rule',
    blurb:
      'Teach the ledger how a new kind of business event should post — the same DSL rows the Inbox reads when it pre-classifies a transaction.',
    tools: ['create-event-handler', 'update-event-handler'],
  },
  {
    title: 'Push an approved entry back out',
    blurb:
      'Publish a committed event to the source-of-truth system, and manage the obligations and schedules that feed the close.',
    tools: ['execute-event-block', 'promote-obligations', 'rebuild-schedule'],
  },
  {
    title: 'Compare across companies',
    blurb:
      'Build a fact grid over canonical concepts to line your numbers up against SEC filers on the same taxonomy.',
    tools: ['build-fact-grid', 'resolve-element'],
  },
  {
    title: 'Run the graph itself',
    blurb:
      'Rebuild the analytical graph after a batch of writes, take a backup, or stand up an isolated workspace to try something out.',
    tools: ['materialize', 'create-backup', 'create-subgraph'],
  },
]

export default function AgentSurface() {
  return (
    <section
      id="agent-surface"
      className="relative border-t border-gray-800/60 bg-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="platform" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="bg-secondary-500/20 text-secondary-300 mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            Agent-first
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Your agent has the wider surface
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Every write operation on the platform becomes a Claude tool the day
            it ships. Screens follow where they earn it — so there are things
            you can do from Claude today that don&apos;t have a button yet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="hover:border-secondary-500/40 flex flex-col rounded-xl border border-gray-800 bg-linear-to-br from-zinc-900 to-black p-5 transition-all"
            >
              <h3 className="mb-2 text-base font-semibold text-white">
                {c.title}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-400">
                {c.blurb}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.tools.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-gray-800 bg-black/60 px-2 py-0.5 font-mono text-[10px] text-gray-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src="/images/claude.svg"
                  alt="Claude"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
                <span className="text-sm font-semibold text-white">
                  Connect Claude to your books
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                Paste your ledger's URL into Claude and it can read your books
                and drive these tools directly — with you approving each write.
                No install. The same tools back the in-app AI Console, so
                nothing is locked behind a desktop app.
              </p>
            </div>
            <div className="w-full shrink-0 lg:w-auto">
              <div className="rounded-lg border border-gray-800 bg-black px-4 py-3">
                <div className="mb-1 text-[10px] tracking-wide text-gray-600 uppercase">
                  Connect
                </div>
                <code className="font-mono text-xs break-all text-gray-300">
                  https://api.robosystems.ai/v1/graphs/
                  <span className="text-gray-500">{'{your-graph-id}'}</span>/mcp
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
