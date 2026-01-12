'use client'

import FloatingElementsVariant from './FloatingElementsVariant'

export default function ProductOverview() {
  return (
    <section id="product" className="relative bg-black py-16 sm:py-24">
      <FloatingElementsVariant variant="product" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Headline */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
            Beyond GraphRAG
          </p>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            The Financial Context Graph
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Your financial data isn't just numbers—it's decisions,
            relationships, and institutional knowledge. RoboSystems transforms
            scattered data into a context graph: a semantic layer where AI
            doesn't just retrieve information, it understands meaning.
          </p>
        </div>

        {/* Transformation Visual */}
        <div className="mb-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Stage 1: Scattered Data */}
              <div className="relative rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
                <div className="absolute -top-3 left-6">
                  <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300">
                    Before
                  </span>
                </div>
                <div className="mb-4 flex h-16 items-center justify-center">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded bg-red-500/20 p-1.5">
                      <div className="h-full w-full rounded-sm bg-red-500/40"></div>
                    </div>
                    <div className="h-8 w-8 rounded bg-blue-500/20 p-1.5">
                      <div className="h-full w-full rounded-sm bg-blue-500/40"></div>
                    </div>
                    <div className="h-8 w-8 rounded bg-green-500/20 p-1.5">
                      <div className="h-full w-full rounded-sm bg-green-500/40"></div>
                    </div>
                    <div className="h-8 w-8 rounded bg-yellow-500/20 p-1.5">
                      <div className="h-full w-full rounded-sm bg-yellow-500/40"></div>
                    </div>
                  </div>
                </div>
                <h3 className="mb-2 text-center font-semibold text-white">
                  Scattered Data
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Spreadsheets, databases, APIs, filings—disconnected silos that
                  lose meaning in isolation
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden items-center justify-center md:flex">
                <div className="flex flex-col items-center">
                  <svg
                    className="h-8 w-8 text-cyan-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span className="mt-2 text-xs text-gray-500">Transform</span>
                </div>
              </div>

              {/* Mobile Arrow */}
              <div className="flex items-center justify-center md:hidden">
                <svg
                  className="h-8 w-8 rotate-90 text-cyan-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>

              {/* Stage 2: Context Graph */}
              <div className="relative rounded-2xl border border-cyan-500/50 bg-gradient-to-br from-cyan-950/40 to-zinc-900 p-6">
                <div className="absolute -top-3 left-6">
                  <span className="rounded-full bg-cyan-600 px-3 py-1 text-xs font-medium text-white">
                    After
                  </span>
                </div>
                <div className="mb-4 flex h-16 items-center justify-center">
                  {/* Simple graph visualization */}
                  <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none">
                    {/* Edges */}
                    <line
                      x1="24"
                      y1="20"
                      x2="48"
                      y2="32"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                    <line
                      x1="48"
                      y1="32"
                      x2="72"
                      y2="20"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                    <line
                      x1="48"
                      y1="32"
                      x2="48"
                      y2="52"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                    <line
                      x1="24"
                      y1="20"
                      x2="24"
                      y2="44"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                    <line
                      x1="72"
                      y1="20"
                      x2="72"
                      y2="44"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                    {/* Nodes */}
                    <circle cx="24" cy="20" r="6" fill="#06b6d4" />
                    <circle cx="72" cy="20" r="6" fill="#06b6d4" />
                    <circle cx="48" cy="32" r="8" fill="#0891b2" />
                    <circle cx="48" cy="52" r="5" fill="#06b6d4" />
                    <circle cx="24" cy="44" r="5" fill="#06b6d4" />
                    <circle cx="72" cy="44" r="5" fill="#06b6d4" />
                  </svg>
                </div>
                <h3 className="mb-2 text-center font-semibold text-white">
                  Context Graph
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Entities, relationships, and meaning—structured for AI to
                  reason through, not just search
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What Context Enables */}
        <div className="mx-auto max-w-5xl">
          <h3 className="mb-8 text-center text-lg font-semibold text-gray-300">
            What Context Enables
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Multi-hop Reasoning */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Multi-Hop Reasoning
              </h4>
              <p className="mb-4 text-sm text-gray-400">
                AI traverses relationships to answer complex questions that span
                multiple data sources and concepts.
              </p>
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs text-gray-500 italic">
                  "What drove the change in gross margin compared to industry
                  peers last quarter?"
                </p>
              </div>
            </div>

            {/* Semantic Understanding */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                <svg
                  className="h-6 w-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Semantic Understanding
              </h4>
              <p className="mb-4 text-sm text-gray-400">
                AI understands financial concepts, not just keywords. Revenue
                isn't a string—it's connected to segments, periods, and
                standards.
              </p>
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs text-gray-500 italic">
                  "Show me all revenue recognition changes across our
                  subsidiaries"
                </p>
              </div>
            </div>

            {/* Institutional Memory */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
                <svg
                  className="h-6 w-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Institutional Memory
              </h4>
              <p className="mb-4 text-sm text-gray-400">
                Every transaction, decision, and relationship is preserved. AI
                remembers context across your entire financial history.
              </p>
              <div className="rounded-lg bg-black/30 p-3">
                <p className="text-xs text-gray-500 italic">
                  "How did we handle this situation when it happened in 2022?"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
