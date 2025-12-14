'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            <span className="block text-white">AI-Native</span>
            <span className="mt-2 block bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text pb-2 text-transparent">
              Financial Reporting
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl">
            Transform natural language requests into complete, validated
            financial statements. RoboLedger combines{' '}
            <strong className="text-cyan-400">Claude AI</strong> with
            RoboSystems' knowledge graph platform to deliver autonomous report
            generation with intelligent guard rails.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:mt-16 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-zinc-800 p-4 transition-all duration-300 hover:border-cyan-500/50 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20">
                  <svg
                    className="h-6 w-6 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Natural Language
                </h3>
                <p className="text-center text-sm text-gray-400">
                  "Create Q4 balance sheet" generates complete validated reports
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-zinc-800 p-4 transition-all duration-300 hover:border-blue-500/50 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg
                    className="h-6 w-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Multi-Layer Validation
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Structural, semantic, and learning-based guard rails ensure
                  accuracy
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-zinc-800 p-4 transition-all duration-300 hover:border-purple-500/50 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
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
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Knowledge Graph Powered
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Built on RoboSystems' knowledge graph platform for semantic
                  queries on complex business relationships in milliseconds
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:mt-16">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-6 py-3 text-base font-medium text-white shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 sm:px-8 sm:py-4 sm:text-lg"
            >
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
            </Link>

            <Link
              href="https://github.com/RoboFinSystems/roboledger-app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-700 bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-all hover:border-cyan-500/50 hover:bg-zinc-800 sm:px-8 sm:py-4 sm:text-lg"
            >
              View on GitHub
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 sm:gap-6 sm:text-sm md:mt-12">
            <div className="flex items-center gap-2">
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
              <span>Powered by Claude</span>
            </div>
            <div className="flex items-center gap-2">
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <span>Built on RoboSystems</span>
            </div>
            <div className="flex items-center gap-2">
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
                  d="M10 20l2-2m2-2l2-2m-2 2l-2-2m2 2l2 2m7-8a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
