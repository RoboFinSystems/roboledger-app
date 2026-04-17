'use client'

import { AnimatedLogo } from '@/lib/core/ui-components'
import Image from 'next/image'
import Link from 'next/link'
import FloatingElementsVariant from './FloatingElementsVariant'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-violet-900/20 via-purple-900/20 to-fuchsia-900/20"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
      </div>

      <FloatingElementsVariant variant="hero" />

      <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 sm:pt-40 sm:pb-24 md:pt-48 md:pb-32 lg:px-8">
        <div className="text-center">
          <h1 className="font-heading mb-6 text-4xl leading-tight font-extrabold sm:text-5xl md:mb-8 md:text-7xl lg:text-8xl">
            <span className="animate-pulsate-gradient-subtle block text-transparent">
              AI-Native
            </span>
            <span className="mt-2 block bg-linear-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text pb-2 text-transparent">
              Financial Reporting
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg md:mt-8 md:text-2xl">
            Transform natural language requests into complete, validated
            financial statements. RoboLedger combines{' '}
            <strong className="text-violet-400">Claude AI</strong> with
            RoboSystems' knowledge graph platform to deliver autonomous report
            generation with intelligent guard rails.
          </p>

          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:mt-16 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/50 hover:bg-violet-950/30 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20">
                  <svg
                    className="h-6 w-6 text-violet-400"
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

            <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-950/30 sm:p-6">
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

            <div className="group relative overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/20 p-4 backdrop-blur-sm transition-all duration-300 hover:border-fuchsia-500/50 hover:bg-fuchsia-950/30 sm:p-6">
              <div className="absolute inset-0 bg-linear-to-br from-fuchsia-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-fuchsia-500/20">
                  <svg
                    className="h-6 w-6 text-fuchsia-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  AI Console
                </h3>
                <p className="text-center text-sm text-gray-400">
                  Ask Claude AI questions about your books — query transactions,
                  explore trends, and get instant financial insights
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mx-auto mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:mt-16">
            <Link
              href="/register"
              className="group relative overflow-hidden rounded-lg bg-linear-to-r from-violet-500 to-purple-500 px-6 py-3 text-base font-medium text-white shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 sm:px-8 sm:py-4 sm:text-lg"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
            </Link>
            <a
              href="https://github.com/RoboFinSystems/roboledger-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-base font-medium text-white transition-all duration-300 hover:border-gray-500 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-lg"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 sm:gap-6 sm:text-sm md:mt-12">
            <div className="flex items-center gap-2">
              <Image
                src="/images/claude.svg"
                alt="Claude AI"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span>Claude AI</span>
            </div>
            <div className="flex items-center gap-2">
              <AnimatedLogo
                app="robosystems"
                animate="loop"
                className="h-5 w-5 text-violet-400"
              />
              <span>Built on RoboSystems</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 126.8 122.88"
              >
                <path
                  fill="#21552A"
                  d="M69.4,78.06c3.92-1.6,6.86-4.61,8.47-8.23c1.65-3.71,1.89-8.04,0.32-12.12l0-0.01 c-1.56-4.07-4.64-7.13-8.35-8.78c-3.7-1.65-8.04-1.89-12.12-0.32l0,0c-4.07,1.56-7.13,4.64-8.78,8.35 c-1.65,3.7-1.89,8.04-0.32,12.12l0,0.01l0.02-0.01c0.8,2.08,2.03,3.95,3.58,5.5c1.57,1.57,3.44,2.81,5.5,3.6 c2.36,0.9,3.54,3.54,2.64,5.9l0.02,0.01l-13.75,35.83c-0.9,2.37-3.55,3.56-5.92,2.66c-0.14-0.05-0.27-0.11-0.4-0.17 c-16.15-6.32-28.25-18.54-34.79-33.22C-1.1,74.35-2.05,57.02,4.22,40.7c0.05-0.14,0.11-0.27,0.17-0.4 c6.32-16.15,18.54-28.25,33.22-34.79C52.44-1.1,69.78-2.05,86.1,4.22c12.31,4.72,22.3,12.87,29.3,22.93 c7.2,10.34,11.23,22.74,11.38,35.56l0,0.04h0.02v1.09c0,0.16-0.01,0.31-0.02,0.46c-0.05,3.64-0.41,7.27-1.09,10.86 c-0.69,3.64-1.73,7.3-3.12,10.94l0.02,0.01c-3.22,8.4-8.15,15.91-14.36,22.12c-6.21,6.21-13.72,11.13-22.12,14.36 c-2.37,0.9-5.02-0.29-5.92-2.66L66.43,84.09c-0.9-2.37,0.29-5.02,2.66-5.92C69.19,78.13,69.29,78.09,69.4,78.06L69.4,78.06z M86.23,73.57c-2.01,4.51-5.35,8.43-9.74,11.12l10.55,27.49c5.48-2.66,10.43-6.2,14.69-10.46c5.32-5.32,9.53-11.73,12.28-18.89 l0.02,0.01l0-0.01c1.17-3.06,2.06-6.2,2.66-9.37c0.59-3.12,0.9-6.22,0.95-9.27c-0.01-0.12-0.01-0.24-0.01-0.36v-1.09h0.02 c-0.13-10.9-3.6-21.48-9.77-30.35c-5.98-8.6-14.52-15.55-25.03-19.59c-13.99-5.37-28.82-4.57-41.48,1.07 c-12.58,5.6-23.04,15.96-28.44,29.76c-0.03,0.11-0.07,0.23-0.11,0.34c-5.37,13.99-4.57,28.82,1.07,41.49 c5.06,11.37,14.01,21.01,25.88,26.75l10.56-27.5c-1.68-1.03-3.22-2.24-4.59-3.61c-2.45-2.45-4.39-5.41-5.66-8.73l0.02-0.01 c-2.47-6.44-2.1-13.27,0.5-19.11c2.53-5.69,7.19-10.44,13.41-12.97c0.3-0.15,0.61-0.28,0.95-0.36c6.3-2.28,12.95-1.87,18.65,0.67 c5.69,2.53,10.44,7.19,12.97,13.41c0.15,0.3,0.28,0.62,0.36,0.95C89.18,61.22,88.77,67.87,86.23,73.57L86.23,73.57z"
                />
                <path
                  fill="#3FA652"
                  d="M70.71,82.46c10.53-4.04,15.78-15.85,11.74-26.38C78.42,45.55,66.61,40.3,56.08,44.34 C45.56,48.38,40.3,60.19,44.34,70.71c2.07,5.4,6.34,9.67,11.74,11.74l-13.75,35.83C12.01,106.65-3.13,72.65,8.51,42.33 C20.14,12.01,54.15-3.13,84.47,8.51c23.16,8.89,37.47,30.84,37.74,54.23v1.09c-0.05,6.87-1.31,13.84-3.91,20.64 c-5.97,15.56-18.26,27.85-33.82,33.82L70.71,82.46L70.71,82.46z"
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
