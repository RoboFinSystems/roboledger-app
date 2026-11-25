'use client'

import { McpLogo } from '@/components/mcp/McpLogo'
import { Dust, GraphStage } from '@robosystems/core/graph-stage'
import { LiveDemo } from '@robosystems/core/ui-components'
import Link from 'next/link'
import {
  BOOK_PATH,
  GITHUB_URL,
  REGISTER_PATH,
  ROBOSYSTEMS_URL,
} from './constants'

const TRUST_ROW = [
  'Open source (Apache 2.0 and MIT)',
  'Every number traced to its entry',
  'Your cloud, your server, or ours',
  'Claude, ChatGPT or any MCP client',
  'SOC 2 in progress',
]

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* A knowledge graph in the brand film's look, in RoboLedger's colours, over the first
          screen and fading out below it. The words sit under it on a narrow page and beside
          it from xl, where GraphStage moves the graph to the right. */}
      <div className="absolute inset-x-0 top-0 h-screen min-h-[640px] [mask-image:linear-gradient(to_bottom,black_72%,transparent)]">
        <GraphStage />
      </div>
      {/* Below the first screen the dust carries on alone, behind the demo. */}
      <Dust className="[mask-image:linear-gradient(to_bottom,transparent_60vh,black_105vh)]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-[26rem] pb-20 sm:px-6 lg:px-8 xl:pt-32">
        <div className="text-center">
          <div className="xl:max-w-[40rem] xl:text-left">
            <p className="font-heading text-primary-300 mb-4 text-xs font-semibold tracking-[0.3em] uppercase md:mb-6">
              For one company or a whole group
            </p>

            {/* One size smaller than the old H1 from md up, so the longer second line holds on
              one line in the widest container. "System" over "software" (2026-11-18): it is
              what a finance-systems buyer builds on; the title keeps "software" for search. */}
            <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl xl:mb-6 xl:text-5xl">
              <span className="block text-white">AI accounting system,</span>
              <span className="text-primary-300 mt-2 block pb-2 text-balance">
                built as a knowledge graph.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl xl:mx-0 xl:mt-6 xl:text-xl">
              Every number opens to the entries and the events behind it, your
              whole group sits in one graph, and the code is yours to keep. Run
              it yourself, or let us host it from $99 a month.{' '}
              <span className="text-white">
                Keep your books where they are today, in QuickBooks or your ERP,
                or keep them on RoboLedger. Either way, your AI works from a
                knowledge graph of them, in Claude, ChatGPT or any MCP client.
              </span>
            </p>

            {/* CTAs: the account first, the meeting second. Booking is a plain
              <a>: /book redirects to the scheduler on another site. */}
            <div className="mx-auto mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center xl:justify-start xl:gap-3">
              <Link
                href={REGISTER_PATH}
                className="group from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 relative overflow-hidden rounded-lg bg-linear-to-r px-6 py-3 text-base font-medium whitespace-nowrap text-white shadow-2xl transition-all duration-300 sm:px-8 sm:py-4 sm:text-lg xl:px-6 xl:py-3 xl:text-base"
              >
                <span className="relative z-10">Create an account</span>
                <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
              </Link>
              <a
                href={BOOK_PATH}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-base font-medium whitespace-nowrap text-white transition-all duration-300 hover:border-gray-500 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-lg xl:px-6 xl:py-3 xl:text-base"
              >
                Book 20 minutes
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-base font-medium whitespace-nowrap text-white transition-all duration-300 hover:border-gray-500 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-lg xl:px-6 xl:py-3 xl:text-base"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Read the code
              </a>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-400 sm:text-base xl:mx-0">
              RoboLedger is the general ledger built on{' '}
              <a
                href={ROBOSYSTEMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                RoboSystems
              </a>
              , the open-source knowledge graph for finance, and a full
              accounting system in its own right, forecasting included.
            </p>
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

          {/* Trust row, the same five as robosystems.ai's, under the demo. */}
          <ul className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-gray-400 sm:text-sm md:mt-12">
            {TRUST_ROW.map((item) => (
              <li key={item} className="flex items-center gap-2">
                {item.includes('MCP') ? (
                  <McpLogo className="h-4 w-4 text-gray-300" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="bg-primary-400 h-1.5 w-1.5 rounded-full"
                  />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
