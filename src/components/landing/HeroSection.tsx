'use client'

import { AnimatedLogo } from '@robosystems/core/ui-components'
import Image from 'next/image'
import Link from 'next/link'
import { GITHUB_URL, REGISTER_PATH, ROBOSYSTEMS_URL } from './constants'
import FloatingElementsVariant from './FloatingElementsVariant'
import ProductShot from './ProductShot'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
      </div>

      <FloatingElementsVariant variant="hero" />

      <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 sm:pt-40 md:pt-44 lg:px-8">
        <div className="text-center">
          <div className="border-primary-500/30 bg-primary-950/40 text-primary-300 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium sm:text-sm">
            <span className="bg-primary-400 h-1.5 w-1.5 rounded-full"></span>
            AI-native accounting, built on a financial knowledge graph
          </div>

          <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            <span className="animate-pulsate-gradient-subtle block text-transparent">
              Close your books
            </span>
            <span className="from-primary-400 via-secondary-400 to-accent-400 mt-2 block bg-linear-to-r bg-clip-text pb-2 text-transparent">
              with AI
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl">
            Connect QuickBooks, let{' '}
            <strong className="text-primary-400">Claude</strong> triage every
            transaction in an inbox, close the period with built-in guard rails,
            and publish validated, XBRL-ready statements —{' '}
            <span className="whitespace-nowrap text-white">
              in hours, not days.
            </span>
          </p>

          {/* CTAs */}
          <div className="mx-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={REGISTER_PATH}
              className="group from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative overflow-hidden rounded-lg bg-linear-to-r px-8 py-4 text-base font-medium text-white shadow-2xl transition-all duration-300 sm:text-lg"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:border-gray-500 hover:bg-white/5 sm:text-lg"
            >
              See how it works
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </Link>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-2">
              <Image
                src="/images/claude.svg"
                alt="Claude AI"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span>Powered by Claude</span>
            </div>
            <a
              href={ROBOSYSTEMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-400 flex items-center gap-2 transition-colors"
            >
              <AnimatedLogo
                app="robosystems"
                brand
                animate="loop"
                className="h-5 w-5"
              />
              <span>Built on RoboSystems</span>
            </a>
            <div className="flex items-center gap-2">
              <svg
                className="text-primary-400 h-4 w-4"
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
              <span>XBRL-ready</span>
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-400 flex items-center gap-2 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Open source</span>
            </a>
          </div>

          {/* Product preview */}
          <div className="mx-auto mt-14 max-w-4xl md:mt-20">
            <ProductShot
              alt="RoboLedger guided period close — schedules drafted, rule engine passed, ready to lock"
              caption="roboledger.ai · Ledger › Closing Book"
              aspect="aspect-[16/9]"
            >
              <HeroClosePreview />
            </ProductShot>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Lightweight in-frame preview of the guided period close — the flagship
 * surface, upstream of the inbox — used until a real screenshot is captured.
 * Mirrors the real panel: fiscal-calendar summary, drafted schedules, rule
 * engine, and the gated Close button.
 */
function HeroClosePreview() {
  const drafts = [
    { name: 'Depreciation — fixed assets', amt: '$4,200.00' },
    { name: 'Prepaid insurance amortization', amt: '$1,150.00' },
    { name: 'Accrued payroll', amt: '$8,940.00' },
  ]
  return (
    <div className="w-full bg-zinc-950 p-4 text-left sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Closing Book</div>
          <div className="text-xs text-gray-500">
            Lock the period once every draft is balanced and validated
          </div>
        </div>
        <div className="bg-primary-500/20 text-primary-300 rounded-full px-3 py-1 text-xs font-medium">
          May 2026 · next to close
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Closed through', 'Apr 2026'],
          ['Pending', '1 period'],
          ['Blockers', '0'],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border border-gray-800 bg-zinc-900/60 p-2"
          >
            <div className="text-[10px] text-gray-500">{k}</div>
            <div className="text-xs font-semibold text-white">{v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {drafts.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between rounded-lg border border-gray-800 bg-zinc-900/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="border-secondary-500/30 bg-secondary-950/50 text-secondary-300 rounded border px-1.5 py-0.5 text-[10px] font-medium">
                schedule
              </span>
              <span className="text-xs text-gray-200">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-gray-400">
                {d.amt}
              </span>
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] text-green-300">
                draft · balanced
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-green-300">
          <svg
            className="h-3.5 w-3.5"
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
          Rule engine — 12 checks passed
        </span>
        <span className="from-primary-500 to-secondary-500 rounded-md bg-linear-to-r px-4 py-1.5 text-[11px] font-semibold text-white">
          Close period →
        </span>
      </div>
    </div>
  )
}
