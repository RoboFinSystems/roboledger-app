'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ContactModal from './ContactModal'
import FloatingElementsVariant from './FloatingElementsVariant'

export default function HeroSection() {
  const [showContactModal, setShowContactModal] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if the openContact query parameter is present
    if (searchParams.get('openContact') === 'true') {
      setShowContactModal(true)
      // Remove the query parameter from the URL without refreshing
      const url = new URL(window.location.href)
      url.searchParams.delete('openContact')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams])

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
      </div>

      {/* Floating elements */}
      <FloatingElementsVariant variant="hero" />

      <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 sm:pt-40 sm:pb-24 md:pt-48 md:pb-32 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            <span className="animate-pulsate-gradient-subtle text-transparent">
              Your Company's
            </span>
            <span className="mt-2 block bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text pb-2 text-transparent">
              Knowledge Graph
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl">
            A knowledge graph platform purpose-built for financial and
            operational intelligence. Transform disconnected data sources into a
            unified semantic layer that AI agents can understand, query, and
            reason over using{' '}
            <strong className="text-cyan-400">
              Model Context Protocol (MCP)
            </strong>{' '}
            tools.
          </p>

          {/* Key Value Props */}
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
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="6" cy="6" r="2" fill="currentColor" />
                    <circle cx="18" cy="6" r="2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2" fill="currentColor" />
                    <circle cx="18" cy="18" r="2" fill="currentColor" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 10V6m0 12v-4m-4-2H6m12 0h-2m-2.5-3.5L8 6m8 0l-1.5 1.5M8 18l1.5-1.5m5 0L16 18"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Context Graph
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Semantic understanding of financial relationships, entities,
                  and meaning—structured for AI reasoning
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  MCP-Powered AI Agents
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Claude AI agents with specialized tools for querying and
                  analyzing your knowledge graph
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-zinc-800 p-4 transition-all duration-300 hover:border-green-500/50 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                  <svg
                    className="h-6 w-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Data Integrations
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Connect QuickBooks, SEC filings, banking data, and custom
                  sources with extensible pipelines
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mx-auto mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:mt-16">
            <a
              href="https://github.com/RoboFinSystems/robosystems"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-6 py-3 text-base font-medium text-white shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 sm:px-8 sm:py-4 sm:text-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </span>
              <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
            </a>
          </div>

          {/* Trust Indicators */}
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
              <span>Powered by LadybugDB</span>
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

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </section>
  )
}
