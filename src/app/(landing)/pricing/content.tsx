'use client'

import ContactModal from '@/components/landing/ContactModal'
import FloatingElementsVariant from '@/components/landing/FloatingElementsVariant'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import { useState } from 'react'

export default function PricingContent() {
  const [showContact, setShowContact] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-black py-16 sm:py-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-heading mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                Transparent Pricing
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-300 sm:text-xl">
                All database operations, queries, imports, and exports are
                included. Only pay for AI agent calls and analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="relative bg-zinc-950 py-16 sm:py-20">
          <FloatingElementsVariant variant="pricing" intensity={15} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Pricing Tiers */}
            <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Standard */}
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-cyan-700 bg-linear-to-br from-cyan-900/50 to-cyan-800/20 p-4 hover:bg-cyan-900/20 sm:p-6 md:p-8">
                <div className="flex-1">
                  <div className="mb-8">
                    <h3 className="font-heading mb-2 text-2xl font-bold text-white">
                      Standard
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">$99</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-gray-400">
                      Dedicated graph infrastructure to get started
                    </p>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      8,000 AI credits/month
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Up to 5M rows per table
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      6 GB dedicated RAM with up to 3 subgraphs
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      7-day backup retention
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30-day money-back guarantee
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowContact(true)}
                    className="block w-full rounded-lg border border-cyan-700 bg-cyan-500/80 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-cyan-800/80"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-orange-600 bg-linear-to-br from-orange-900/50 to-orange-800/20 p-4 hover:bg-orange-900/20 sm:p-6 md:p-8">
                <div className="absolute -top-1 -right-1">
                  <div className="rounded-bl-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
                    MOST POPULAR
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-8">
                    <h3 className="font-heading mb-2 text-2xl font-bold text-white">
                      Large
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">
                        $299
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-gray-400">
                      Enhanced performance for growing companies
                    </p>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      32,000 AI credits/month
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Up to 25M rows per table
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      14 GB dedicated RAM with up to 10 subgraphs
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30-day backup retention
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30-day money-back guarantee
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowContact(true)
                  }}
                  className="block w-full rounded-lg bg-orange-600 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-orange-700"
                >
                  Contact Sales
                </button>
              </div>

              {/* Premium */}
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-purple-500/50 bg-linear-to-br from-purple-900/20 to-zinc-800 p-4 hover:bg-purple-900/20 sm:p-6 md:p-8">
                <div className="flex-1">
                  <div className="mb-8">
                    <h3 className="font-heading mb-2 text-2xl font-bold text-white">
                      XLarge
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">
                        $699
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-gray-400">
                      Maximum performance for data-intensive operations
                    </p>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      100,000 AI credits/month
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Up to 100M rows per table
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30 GB dedicated RAM with up to 25 subgraphs
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      90-day backup retention
                    </li>
                    <li className="flex items-start text-gray-300">
                      <svg
                        className="mr-3 h-5 w-5 shrink-0 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30-day money-back guarantee
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowContact(true)
                  }}
                  className="block w-full rounded-lg border border-purple-500/50 bg-purple-500/80 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-purple-900/30"
                >
                  Contact Sales
                </button>
              </div>
            </div>

            {/* SEC Financial Agent Add-on */}
            <div className="mt-16">
              <h3 className="mb-8 text-center text-2xl font-bold text-white">
                Shared Repository Add-On
              </h3>
              <div className="mx-auto max-w-sm">
                <div className="rounded-xl border border-green-500/30 bg-linear-to-br from-green-900/50 to-green-900/20 p-8 hover:bg-green-900/20">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-600">
                      <span className="text-2xl font-bold text-white">SEC</span>
                    </div>
                  </div>
                  <h4 className="mb-3 text-xl font-semibold text-white">
                    AI-Powered SEC Financial Analyst Agent
                  </h4>
                  <p className="mb-6 text-gray-300">
                    Access 100,000+ SEC filings from 4,000+ public companies
                    through an intelligent AI agent that understands financial
                    relationships and can answer complex queries in natural
                    language.
                  </p>
                  <div className="mb-6 text-3xl font-bold text-white">
                    From $29
                    <span className="text-base font-normal text-gray-400">
                      /month
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex gap-2">
                      <svg
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Same day access to AI enriched SEC filings</span>
                    </div>
                    <div className="flex gap-2">
                      <svg
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Natural language queries with Claude AI</span>
                    </div>
                    <div className="flex gap-2">
                      <svg
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>
                        Benchmarking and market analytics with rich context
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowContact(true)
                    }}
                    className="mt-6 block w-full rounded-lg border border-green-700 bg-green-500/80 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-green-800/80"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="mt-16">
              <h3 className="mb-8 text-center text-2xl font-bold text-white">
                Frequently Asked Questions
              </h3>
              <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg border border-gray-800 bg-zinc-900 p-6">
                  <h4 className="mb-2 font-semibold text-white">
                    What are credits used for?
                  </h4>
                  <p className="text-gray-400">
                    Credits are used for AI agent interactions and storage
                    overage. AI calls are billed based on token usage, with a
                    typical agent call consuming about 38 credits. Storage
                    beyond your included allocation costs 1 credit per GB per
                    day. Database operations, imports, exports, queries, and MCP
                    tool access don't consume credits (subject to rate limits by
                    tier).
                  </p>
                </div>
                <div className="rounded-lg border border-gray-800 bg-zinc-900 p-6">
                  <h4 className="mb-2 font-semibold text-white">
                    Can I upgrade or downgrade my plan?
                  </h4>
                  <p className="text-gray-400">
                    Yes, you can change your plan at any time. Upgrades take
                    effect immediately, and downgrades take effect at the start
                    of your next billing cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-heading mb-4 text-3xl font-bold text-white">
              Ready to Transform Your Financial Data?
            </h2>
            <p className="mb-8 text-lg text-gray-400">
              Start building your knowledge graph today with our enterprise
              platform
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => {
                  setShowContact(true)
                }}
                className="rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-8 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Contact Sales
              </button>
              <a
                href="/open-source"
                className="rounded-lg border border-gray-700 bg-zinc-800 px-8 py-3 font-medium text-white transition-all hover:bg-zinc-700"
              >
                Deploy Open Source
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
      />
    </div>
  )
}
