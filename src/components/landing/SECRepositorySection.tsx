'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import FloatingElementsVariant from './FloatingElementsVariant'

const QUERIES = [
  {
    label: 'R&D Spending',
    question:
      "Compare Microsoft and Google's R&D spending as a percentage of revenue over the last 3 years",
    response: `Analyzing SEC filings for MSFT and GOOGL...

Microsoft (MSFT) R&D % of Revenue:
  FY2025: 13.2%  ($28.1B / $212.6B)
  FY2024: 12.8%  ($27.2B / $211.9B)
  FY2023: 12.4%  ($25.3B / $204.1B)

Alphabet (GOOGL) R&D % of Revenue:
  FY2025: 12.7%  ($45.4B / $357.6B)
  FY2024: 12.2%  ($42.8B / $350.0B)
  FY2023: 12.1%  ($39.5B / $326.8B)

Trend: Both companies increased R&D intensity.
Microsoft leads by ~0.5pp despite lower absolute spend.`,
  },
  {
    label: 'Semiconductor Margins',
    question:
      'What are the gross margins for the top 5 semiconductor companies?',
    response: `Querying XBRL facts for SIC code 3674...

Gross Margins (TTM):
  NVDA  (NVIDIA):          74.8%
  AVGO  (Broadcom):        68.2%
  QCOM  (Qualcomm):        56.1%
  AMD   (AMD):             50.7%
  INTC  (Intel):           41.3%

Industry median: 52.4%
NVIDIA's margin expansion driven by data center GPU
demand, up from 64.6% two years ago.`,
  },
  {
    label: 'Apple Revenue',
    question: "Show Apple's revenue trend by segment for the last 4 quarters",
    response: `Traversing revenue segments for AAPL...

Apple Revenue by Segment (Quarterly, $B):
                   Q1'26   Q4'25   Q3'25   Q2'25
  iPhone:          $71.2   $46.2   $39.3   $45.6
  Services:        $26.3   $25.0   $24.2   $23.1
  Mac:             $11.8   $ 7.7   $ 7.0   $ 6.8
  iPad:            $ 9.4   $ 6.9   $ 7.2   $ 5.6
  Wearables:       $17.9   $10.0   $ 8.1   $ 7.7

Services segment shows consistent QoQ growth,
now representing 19.3% of total revenue.`,
  },
  {
    label: 'Bank Ratios',
    question:
      'Compare debt-to-equity ratios for JPMorgan, Bank of America, and Wells Fargo',
    response: `Pulling balance sheet data for major banks...

Debt-to-Equity Ratios (Most Recent Filing):
  JPM  (JPMorgan Chase):      1.18
  BAC  (Bank of America):     1.42
  WFC  (Wells Fargo):         1.26

Historical Comparison (YoY):
  JPM: 1.18 vs 1.21 (-2.5%)  ▼ Improving
  BAC: 1.42 vs 1.38 (+2.9%)  ▲ Increasing
  WFC: 1.26 vs 1.31 (-3.8%)  ▼ Improving

JPMorgan maintains lowest leverage among
the three largest US banks by assets.`,
  },
]

const CYCLE_INTERVAL = 6000

export default function SECRepositorySection() {
  const [activeQuery, setActiveQuery] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCycling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveQuery((prev) => (prev + 1) % QUERIES.length)
    }, CYCLE_INTERVAL)
  }, [])

  const stopCycling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    const ref = sectionRef.current
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.2 }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isVisible) {
      startCycling()
    } else {
      stopCycling()
    }
    return stopCycling
  }, [isVisible, startCycling, stopCycling])

  const handleQuerySelect = (index: number) => {
    setActiveQuery(index)
    startCycling()
  }

  return (
    <section
      id="sec-repository"
      ref={sectionRef}
      className="relative overflow-hidden bg-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="sec-repository" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold tracking-wider text-cyan-400 uppercase">
            SEC XBRL Repository
          </p>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Every Public Company. One Knowledge Graph.
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            A pre-built knowledge graph of every public company&apos;s SEC
            filings. Subscribe once and your AI agents gain instant access to
            market intelligence&mdash;no data pipeline setup required.
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: '4,000+', label: 'Public Companies' },
            { value: '100K+', label: 'XBRL Filings' },
            { value: 'Daily', label: 'Updates' },
            { value: '10-K & 10-Q', label: 'Financial Statements' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-800 bg-zinc-900/50 p-4 text-center sm:p-6"
            >
              <div className="text-2xl font-bold text-cyan-400 sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-gray-400 sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Demo + Access Methods */}
        <div className="mb-16 grid gap-6 lg:grid-cols-5">
          {/* Terminal Demo - Left */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-zinc-900/50">
              {/* Terminal chrome */}
              <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span className="ml-2 text-xs text-gray-500">
                  SEC Repository — AI Query Console
                </span>
                <span className="ml-auto text-xs text-gray-600">
                  Simulated results
                </span>
              </div>

              {/* Query + Response */}
              <div className="h-[420px] overflow-y-auto p-4 sm:p-6">
                <div className="mb-4">
                  <span className="text-xs text-gray-500">QUERY</span>
                  <p className="mt-1 text-sm text-gray-300 italic sm:text-base">
                    &ldquo;{QUERIES[activeQuery].question}&rdquo;
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">RESPONSE</span>
                  <pre className="mt-1 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-cyan-300/90 sm:text-sm">
                    {QUERIES[activeQuery].response}
                  </pre>
                </div>
              </div>

              {/* Query selector tabs */}
              <div className="flex flex-wrap gap-1 border-t border-gray-800 px-4 py-3">
                {QUERIES.map((q, i) => (
                  <button
                    key={q.label}
                    onClick={() => handleQuerySelect(i)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      i === activeQuery
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Access Methods - Right */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* MCP Clients */}
            <div className="flex-1 rounded-xl border border-gray-800 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20">
                  <svg
                    className="h-5 w-5 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">MCP Clients</h4>
              </div>
              <p className="text-sm text-gray-400">
                Use with Claude Desktop, Claude Code, Cursor, or any
                MCP-compatible AI client.
              </p>
            </div>

            {/* MCP Protocol */}
            <div className="flex-1 rounded-xl border border-gray-800 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
                  <svg
                    className="h-5 w-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">MCP Protocol</h4>
              </div>
              <div className="rounded-lg bg-black/40 p-2.5">
                <code className="text-xs text-gray-300">
                  npx -y @robosystems/mcp
                </code>
              </div>
            </div>

            {/* API & SDKs */}
            <div className="flex-1 rounded-xl border border-gray-800 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">API & SDKs</h4>
              </div>
              <div className="space-y-1.5">
                <div className="rounded-lg bg-black/40 p-2.5">
                  <code className="text-xs text-gray-300">
                    npm i @robosystems/client
                  </code>
                </div>
                <div className="rounded-lg bg-black/40 p-2.5">
                  <code className="text-xs text-gray-300">
                    pip install robosystems-client
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-lg border border-gray-700 px-8 py-3 text-sm font-semibold text-gray-300 transition-all hover:border-gray-500 hover:text-white"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  )
}
