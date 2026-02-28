import FloatingElementsVariant from '../landing/FloatingElementsVariant'

export default function BusinessServices() {
  const primaryServices = [
    {
      title: 'QuickBooks Integration',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      color: 'cyan',
      highlight: 'OAuth2 Secure Connection',
      description:
        'Synchronize your QuickBooks accounting data into the RoboLedger schema for unified reporting and analysis.',
      features: [
        'Chart of accounts synchronization',
        'Journal entries and transactions',
        'Trial balance import',
      ],
    },
  ]

  const dataManagementServices = [
    {
      title: 'RoboLedger Application',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      gradient: 'from-indigo-600 to-blue-600',
      capabilities: [
        'Financial report builder',
        'Ledger and journal management',
        'Entity data visualization',
      ],
    },
    {
      title: 'MCP Agent Access',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      gradient: 'from-purple-600 to-pink-600',
      capabilities: [
        'Natural language queries',
        'Claude AI integration',
        'Cypher query generation',
      ],
    },
  ]

  const roadmapServices = [
    {
      title: 'SEC Filing Import',
      description:
        "Import your company's 10-K/10-Q filings by CIK for normalized financial statement analysis",
    },
    {
      title: 'Plaid Banking',
      description:
        'Connect bank accounts for automated transaction feeds and reconciliation',
    },
    {
      title: 'XBRL-Native Reports',
      description:
        'Generate reports as structured data—comparable, portable, and machine-readable',
    },
  ]

  const visionHighlights = [
    {
      title: 'Reports as Structured Data',
      description:
        'Unlike traditional PDF reports, RoboLedger creates XBRL-native financial reports that are inherently queryable and comparable across periods.',
    },
    {
      title: 'AI-Native Report Builder',
      description:
        'Claude generates financial reports from natural language requests. AI handles the mechanical work at machine speed—humans apply judgment on what matters.',
    },
  ]

  return (
    <section className="relative bg-gradient-to-b from-zinc-950 to-black py-16 sm:py-20">
      <FloatingElementsVariant variant="platform-business" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
            Accounting Data Integration & Management
          </h2>
          <p className="mx-auto max-w-3xl text-gray-400">
            Powered by the RoboLedger schema that unifies QuickBooks
            transactions, SEC XBRL filings, and banking data into a single,
            queryable knowledge graph
          </p>
        </div>

        {/* Primary Service */}
        <div className="mx-auto mb-12 max-w-2xl">
          {primaryServices.map((service, idx) => (
            <PrimaryServiceCard key={idx} {...service} />
          ))}
        </div>

        {/* Secondary Services - Compact Grid */}
        <div className="mx-auto mb-12 grid max-w-3xl gap-6 md:grid-cols-2">
          {dataManagementServices.map((service, idx) => (
            <SecondaryServiceCard key={idx} {...service} index={idx} />
          ))}
        </div>

        {/* Vision Highlights */}
        <div className="mx-auto mb-12 max-w-4xl">
          <h3 className="mb-6 text-center text-lg font-semibold text-white">
            The Vision: Knowledge Graph Driven Financial Reporting
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {visionHighlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-cyan-950/10 p-6"
              >
                <h4 className="mb-2 font-semibold text-cyan-400">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="mx-auto mb-12 max-w-4xl">
          <h3 className="mb-4 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase">
            Coming Soon
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {roadmapServices.map((service, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-dashed border-gray-700 bg-zinc-900/30 p-4 text-center"
              >
                <h4 className="font-medium text-gray-400">{service.title}</h4>
                <p className="mt-1 text-sm text-gray-500">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="rounded-2xl border border-gray-800 bg-zinc-900 p-8">
          <h3 className="mb-6 text-center text-xl font-bold text-white">
            How It Works
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 to-cyan-950/20 p-4 text-center transition-all hover:border-cyan-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <span className="text-xl font-bold">1</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Connect QuickBooks
              </h4>
              <p className="text-sm text-gray-400">
                Securely authenticate with QuickBooks via OAuth to grant
                RoboLedger read access to your accounting data
              </p>
            </div>
            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 to-purple-950/20 p-4 text-center transition-all hover:border-purple-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <span className="text-xl font-bold">2</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">Sync to Graph</h4>
              <p className="text-sm text-gray-400">
                Data flows into the RoboLedger schema within your company's
                isolated knowledge graph
              </p>
            </div>
            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 to-green-950/20 p-4 text-center transition-all hover:border-green-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                <span className="text-xl font-bold">3</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Analyze & Report
              </h4>
              <p className="text-sm text-gray-400">
                Use RoboLedger to build reports, or query via MCP agents for
                AI-powered insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PrimaryServiceCard({
  title,
  icon,
  color,
  highlight,
  description,
  features,
  currentCapabilities,
}: any) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-500/50',
    purple:
      'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50',
  }

  const iconColors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
  }

  const bulletColors: Record<string, string> = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 transition-all ${colorClasses[color]}`}
    >
      <div className="mb-6 flex items-start gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-xl ${iconColors[color]}`}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon}
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
          <p className="text-gray-300">{description}</p>
        </div>
      </div>

      <div className="mb-6">
        <ul className="space-y-3">
          {features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start">
              <svg
                className={`mr-3 h-5 w-5 ${bulletColors[color]} mt-0.5`}
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
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SecondaryServiceCard({
  title,
  icon,
  gradient,
  capabilities,
  index,
}: any) {
  // Different border hover colors for variety
  const borderColors = [
    'hover:border-green-500/50',
    'hover:border-purple-500/50',
    'hover:border-indigo-500/50',
  ]

  // Different background gradients for each card
  const bgGradients = [
    'from-zinc-900 to-green-950/20',
    'from-zinc-900 to-purple-950/20',
    'from-zinc-900 to-indigo-950/20',
  ]

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br ${bgGradients[index]} p-6 transition-all ${borderColors[index]}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-5`}
      ></div>

      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
      >
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={icon}
          />
        </svg>
      </div>

      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>

      <ul className="space-y-2">
        {capabilities.map((capability: string, idx: number) => (
          <li key={idx} className="flex items-center text-sm text-gray-400">
            <svg
              className="mr-2 h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            {capability}
          </li>
        ))}
      </ul>
    </div>
  )
}
