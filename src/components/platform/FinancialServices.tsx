import FloatingElementsVariant from '../landing/FloatingElementsVariant'

export default function FinancialServices() {
  const currentServices = [
    {
      title: 'SEC Shared Repository',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      gradient: 'from-purple-500 to-pink-500',
      description:
        'Query 100,000+ SEC XBRL filings across 4,000+ public companies for securities research and competitive analysis.',
      currentFeatures: [
        '10-K and 10-Q financial statements',
        'Company fundamentals and ratios',
        'Peer comparison across industries',
      ],
    },
    {
      title: 'MCP Agent Access',
      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      gradient: 'from-cyan-500 to-blue-500',
      description:
        'Natural language queries against the SEC repository via Claude AI and the MCP protocol.',
      currentFeatures: [
        'Ask questions in plain English',
        'AI-generated Cypher queries',
        'Structured financial data responses',
      ],
    },
    {
      title: 'RoboInvestor Application',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      gradient: 'from-indigo-500 to-purple-500',
      description:
        'Web interface for exploring the SEC repository and conducting securities research.',
      currentFeatures: [
        'Chat-based research interface',
        'Entity exploration and discovery',
        'Query history and saved searches',
      ],
    },
  ]

  const roadmapServices = [
    {
      title: 'Portfolio Sync',
      description:
        'Connect brokerage accounts (Schwab, Fidelity) to sync holdings',
    },
    {
      title: 'Market Data',
      description: 'Historical prices, benchmarks, and corporate actions',
    },
    {
      title: 'Performance Analytics',
      description: 'Portfolio returns, attribution, and risk metrics',
    },
  ]

  const visionHighlights = [
    {
      title: 'The Bridge',
      description:
        "RoboInvestor connects fund-level investments to underlying company financial and operational data. Your investment in Company X links directly to Company X's data from RoboLedger.",
    },
    {
      title: 'From Founders to PE Firms',
      description:
        "Whether you're a founder tracking personal investments alongside your business, or a PE firm managing 20+ portfolio companies, the same graph connects it all.",
    },
  ]

  return (
    <section className="relative overflow-hidden bg-black py-16 sm:py-20">
      <FloatingElementsVariant variant="platform-investment" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
            Securities Research & Investment Analytics
          </h2>
          <p className="mx-auto max-w-3xl text-gray-400">
            Access the SEC Shared Repository through RoboInvestor for AI-powered
            securities research and competitive analysis
          </p>
        </div>

        {/* Current Services */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {currentServices.map((service, idx) => (
            <InvestmentServiceCard key={idx} {...service} index={idx} />
          ))}
        </div>

        {/* Vision Highlights */}
        <div className="mx-auto mb-12 max-w-4xl">
          <h3 className="mb-6 text-center text-lg font-semibold text-white">
            The Vision: Unified Investment & Accounting
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {visionHighlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-purple-950/10 p-6"
              >
                <h4 className="mb-2 font-semibold text-purple-400">
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
            Roadmap: Portfolio Analytics Platform
          </h3>
          <p className="mb-6 text-center text-sm text-gray-500">
            Expanding RoboInvestor to support personal portfolios, family
            offices, and institutional investors
          </p>
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
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-r from-zinc-900 to-zinc-800 p-8">
          <h3 className="mb-6 text-center text-xl font-bold text-white">
            How It Works
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-black/50 to-purple-950/20 p-4 text-center transition-all hover:border-purple-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <span className="text-xl font-bold">1</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">
                Access Repository
              </h4>
              <p className="text-sm text-gray-400">
                Connect to the SEC Shared Repository containing all public
                company XBRL filings
              </p>
            </div>

            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-black/50 to-cyan-950/20 p-4 text-center transition-all hover:border-cyan-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <span className="text-xl font-bold">2</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">Ask Questions</h4>
              <p className="text-sm text-gray-400">
                Query in natural language or Cypher—AI translates your questions
                into optimized graph queries
              </p>
            </div>

            <div className="group rounded-lg border border-gray-800 bg-gradient-to-br from-black/50 to-green-950/20 p-4 text-center transition-all hover:border-green-500/30">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                <span className="text-xl font-bold">3</span>
              </div>
              <h4 className="mb-2 font-semibold text-white">Get Insights</h4>
              <p className="text-sm text-gray-400">
                Receive structured financial data, comparisons, and analysis for
                your research
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function InvestmentServiceCard({
  title,
  icon,
  gradient,
  description,
  currentFeatures,
  index,
}: any) {
  // Different border hover colors for each card
  const borderColors = [
    'hover:border-cyan-500/50',
    'hover:border-blue-500/50',
    'hover:border-purple-500/50',
    'hover:border-green-500/50',
    'hover:border-orange-500/50',
    'hover:border-indigo-500/50',
  ]

  // Different background gradients for each card
  const bgGradients = [
    'from-zinc-900 to-zinc-800',
    'from-zinc-900 to-blue-950/30',
    'from-zinc-900 to-purple-950/30',
    'from-zinc-900 to-green-950/30',
    'from-zinc-900 to-orange-950/30',
    'from-zinc-900 to-indigo-950/30',
  ]

  return (
    <div className="group relative">
      <div
        className={`relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br ${bgGradients[index]} p-6 transition-all duration-300 ${borderColors[index]}`}
      >
        {/* Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
        ></div>

        {/* Header */}
        <div className="relative mb-4 flex items-start gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
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
          <div className="flex-1">
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-400">{description}</p>

        {/* Current Features */}
        <div className="relative">
          <ul className="space-y-1">
            {currentFeatures.map((feature: string, idx: number) => (
              <li key={idx} className="flex items-start text-sm text-gray-300">
                <svg
                  className="mt-0.5 mr-2 h-4 w-4 text-green-500"
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
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
