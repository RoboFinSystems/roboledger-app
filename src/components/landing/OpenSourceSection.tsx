'use client'

import { useState } from 'react'
import ContactModal from './ContactModal'
import FloatingElementsVariant from './FloatingElementsVariant'

export default function OpenSourceSection() {
  const [showEnterpriseContact, setShowEnterpriseContact] = useState(false)
  return (
    <section id="opensource" className="relative bg-black py-16 sm:py-24">
      <FloatingElementsVariant variant="opensource" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Open Source Foundation
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            RoboSystems is committed to open source. Fork and self-host the
            entire platform, contribute to development, or use our managed
            service for hassle-free AI-powered financial analysis tools.
          </p>
        </div>

        {/* Featured GitHub Repository */}
        <div className="mb-8 rounded-2xl border-2 border-cyan-500/50 bg-linear-to-br from-cyan-900/30 to-blue-900/30 p-4 hover:border-cyan-500/30 hover:bg-cyan-900/20 sm:mb-12 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6 md:flex-row md:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 sm:h-20 sm:w-20">
              <svg
                className="h-10 w-10 text-white sm:h-12 sm:w-12"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-heading mb-3 text-xl font-bold text-white sm:text-2xl">
                RoboSystems GitHub
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                The heart of the RoboSystems ecosystem - our main repository
                contains the complete knowledge graph platform including the API
                server, semantic data processing, infrastructure templates, and
                deployment workflows. Everything you need to run your own
                financial knowledge graph - locally or in your cloud
                infrastructure.
              </p>
              <div className="flex flex-wrap justify-center gap-4 md:justify-start">
                <a
                  href="https://github.com/RoboFinSystems/robosystems"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 font-medium text-white transition-all duration-300 hover:bg-cyan-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                </a>
                <a
                  href="https://github.com/RoboFinSystems/robosystems/fork"
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-600 px-5 py-2.5 font-medium text-cyan-400 transition-all duration-300 hover:bg-cyan-600/10"
                >
                  🍴 Fork & Contribute
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Open Source Philosophy */}
            <div className="group overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-cyan-950/20 p-4 transition-all hover:border-cyan-500/50 sm:p-6 md:p-8">
              <h3 className="font-heading mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
                Why Open Source?
              </h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 shrink-0 text-cyan-400"
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
                  <div className="min-w-0 flex-1">
                    <strong className="text-white">Transparency & Trust</strong>
                    <p className="mt-1 text-sm break-words">
                      See exactly how your financial data is processed and
                      stored. No black boxes.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <strong className="text-white">Community Innovation</strong>
                    <p className="mt-1 text-sm break-words">
                      Accelerate development with contributions from developers
                      worldwide.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <strong className="text-white">
                      Security Through Scrutiny
                    </strong>
                    <p className="mt-1 text-sm break-words">
                      Open code means more eyes finding and fixing potential
                      issues.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <strong className="text-white">
                      Foundation Technology
                    </strong>
                    <p className="mt-1 text-sm break-words">
                      Following XBRL and Arelle's footsteps in creating open
                      financial standards for the AI age.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Enterprise Services */}
            <div className="group overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-purple-950/20 p-4 transition-all hover:border-purple-500/50 sm:p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
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
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-heading text-xl font-semibold text-white">
                  Enterprise Services
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-300">
                The platform is free. We help you succeed with it.
              </p>

              <ul className="mb-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  <span>
                    <strong className="text-white">Custom Integrations</strong>
                    —connect your ERP, banking, or proprietary data sources
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  <span>
                    <strong className="text-white">
                      Implementation Support
                    </strong>
                    —deployment, training, and onboarding for your team
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  <span>
                    <strong className="text-white">AI Support Agents</strong>
                    —ongoing maintenance and optimization of your knowledge
                    graph
                  </span>
                </li>
              </ul>

              <button
                onClick={() => setShowEnterpriseContact(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                Contact Us
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Fork & Deploy */}
            <div className="group overflow-hidden rounded-2xl border border-emerald-500/30 bg-linear-to-br from-zinc-900 to-emerald-950/20 p-4 transition-all hover:border-emerald-500/50 sm:p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                  <svg
                    className="h-5 w-5 text-emerald-400"
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
                <h3 className="font-heading text-xl font-semibold text-white">
                  Fork & Deploy
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-300">
                Deploy your own instance with secure GitHub OIDC—no AWS
                credentials stored in GitHub. Full CloudFormation templates and
                GitHub Actions workflows included.
              </p>

              <a
                href="https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Bootstrap Guide
              </a>
            </div>

            {/* Download */}
            <div className="group overflow-hidden rounded-2xl border border-cyan-500/30 bg-linear-to-br from-cyan-900/30 to-blue-900/20 p-4 transition-all hover:border-cyan-500/50 sm:p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold text-white sm:text-2xl">
                  Download RoboSystems
                </h3>
              </div>

              <div className="space-y-4 overflow-x-hidden">
                {/* SDKs */}
                <div className="rounded-lg bg-zinc-800/50 p-3 sm:p-4">
                  <h4 className="mb-2 font-semibold text-white">
                    MCP Client and Developer Tools
                  </h4>
                  <p className="mb-3 text-sm break-words text-gray-400">
                    Official packages for integrating with RoboSystems.
                  </p>
                  <div className="space-y-3">
                    {/* MCP Tools */}
                    <div>
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <a
                          href="https://www.npmjs.com/package/@robosystems/mcp"
                          className="inline-flex items-center gap-2 rounded-md bg-zinc-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600"
                        >
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
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          @robosystems/mcp
                        </a>
                        <span className="self-start text-xs text-gray-500 sm:self-auto">
                          MCP Client
                        </span>
                      </div>
                    </div>
                    {/* Typescript Client */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href="https://www.npmjs.com/package/@robosystems/client"
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M0 0v24h24v-24h-24zm19.5 16.5h-3v3h-9v-3h-3v-9h15v9z" />
                        </svg>
                        @robosystems/client
                      </a>
                      <span className="self-start text-xs text-gray-500 sm:self-auto">
                        TypeScript/React
                      </span>
                    </div>

                    {/* Python Client */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href="https://pypi.org/project/robosystems-client/"
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                        </svg>
                        robosystems-client
                      </a>
                      <span className="self-start text-xs text-gray-500 sm:self-auto">
                        Python/Jupyter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Start */}
                <div className="mt-4 rounded-lg bg-blue-900/20 p-3 sm:p-4">
                  <h4 className="mb-2 font-semibold text-blue-300">
                    Local Development
                  </h4>
                  <pre className="overflow-x-auto rounded-sm bg-zinc-900 p-2 text-xs text-gray-300 sm:p-3">
                    <code>{`# Clone and install tools
git clone https://github.com/RoboFinSystems/robosystems
cd robosystems
brew install uv just  # or: pip install uv && cargo install just

# Start local Docker stack
just start

# API at http://localhost:8000`}</code>
                  </pre>
                  <p className="mt-2 text-xs text-gray-500">
                    For production deployment, see the{' '}
                    <a
                      href="https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Bootstrap Guide
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community & Contribution */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-linear-to-r from-zinc-900 to-purple-950/20 p-4 sm:mt-12 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <h3 className="font-heading mb-4 text-center text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
              Join the RoboSystems Community
            </h3>
            <p className="mb-8 text-center text-gray-300">
              Be part of building the future of financial AI infrastructure
            </p>

            <div className="mb-6 grid gap-4 sm:mb-8 sm:gap-6 md:grid-cols-2">
              <div className="group rounded-lg border-2 border-gray-800 bg-linear-to-br from-zinc-900 to-green-950/20 p-4 transition-all hover:border-green-500/50 sm:p-6">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-white">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Development & Contribution
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Track our roadmap and upcoming features
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Submit pull requests and contribute code
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Review source code and architecture
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Fork and customize for your needs
                    </span>
                  </li>
                </ul>
              </div>
              <div className="group rounded-lg border-2 border-gray-800 bg-linear-to-br from-zinc-900 to-indigo-950/20 p-4 transition-all hover:border-indigo-500/50 sm:p-6">
                <h4 className="mb-3 font-semibold text-white">
                  🤝 Community Support
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Report bugs and request features
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Join discussions on architecture decisions
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Share your implementations and use cases
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1 flex-shrink-0">•</span>
                    <span className="break-words">
                      Get help from maintainers and community
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/orgs/RoboFinSystems/projects/3"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-cyan-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Roadmap
              </a>
              <a
                href="https://github.com/RoboFinSystems/robosystems/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-indigo-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub Discussions
              </a>
              <a
                href="https://github.com/RoboFinSystems/robosystems/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-6 py-3 font-medium text-white transition-all duration-300 hover:bg-zinc-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Report Issues
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showEnterpriseContact}
        onClose={() => setShowEnterpriseContact(false)}
        title="Enterprise Services"
        description="Tell us about your project and we'll help you build your knowledge graph."
        formType="enterprise_sales"
      />
    </section>
  )
}
