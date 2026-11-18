'use client'

import { McpLogo } from '@/components/mcp/McpLogo'
import { LiveDemo } from '@robosystems/core/ui-components'
import Link from 'next/link'
import {
  BOOK_PATH,
  GITHUB_URL,
  REGISTER_PATH,
  ROBOSYSTEMS_URL,
} from './constants'
import FloatingElementsVariant from './FloatingElementsVariant'

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
            Your books, in the chat you already use
          </div>

          {/* One size smaller than the old H1 from md up: "AI accounting software" is wider
              than "Connect your books." and broke onto two lines at 8xl even in the widest
              container. */}
          <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl">
            <span className="animate-pulsate-gradient-subtle block text-transparent">
              AI accounting software
            </span>
            <span className="from-primary-400 via-secondary-400 to-accent-400 mt-2 block bg-linear-to-r bg-clip-text pb-2 text-transparent">
              you own.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl">
            A general ledger{' '}
            <strong className="text-primary-400">
              Claude, ChatGPT, or any MCP client
            </strong>{' '}
            can reason over: close, consolidation, schedules, bank feeds and
            reconciliations, with statements that tie and every number traced to
            the entry. Start from your QuickBooks or keep the books here, for
            one company or a whole group, with your numbers beside public
            companies&apos;.{' '}
            <span className="text-white">
              Nothing writes back until you post an entry.
            </span>
          </p>

          {/* CTAs: the account first, the meeting second. Booking is a plain
              <a>: /book redirects to the scheduler on another site. */}
          <div className="mx-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={REGISTER_PATH}
              className="group from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative overflow-hidden rounded-lg bg-linear-to-r px-8 py-4 text-base font-medium text-white shadow-2xl transition-all duration-300 sm:text-lg"
            >
              <span className="relative z-10">Create an account</span>
              <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
            </Link>
            <a
              href={BOOK_PATH}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:border-gray-500 hover:bg-white/5 sm:text-lg"
            >
              Book 20 minutes
            </a>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-400 sm:text-base">
            RoboLedger is the general ledger built on{' '}
            <a
              href={ROBOSYSTEMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              RoboSystems
            </a>
            , the open-source knowledge graph for finance, and a full accounting
            system in its own right, forecasting included.
          </p>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-2">
              <McpLogo className="h-5 w-5 text-gray-300" />
              <span>Works with any MCP client</span>
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
          <div className="relative mx-auto mt-14 max-w-6xl md:mt-20">
            <div className="from-primary-500/20 to-accent-500/20 absolute -inset-1 rounded-3xl bg-linear-to-br opacity-50 blur-xl"></div>
            <LiveDemo
              name="hero"
              aspect={16 / 9}
              phoneAspect={720 / 1080}
              label="A finance lead asks their AI why cash is down, shares the balance sheet with the board, plans next quarter, compares against public peers, and approves the close, while RoboLedger updates beside the chat."
              className="rounded-2xl border border-gray-800 bg-black shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
