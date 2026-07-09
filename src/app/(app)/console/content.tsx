'use client'

import {
  ConsoleContent,
  useGraphAwareConsoleConfig,
  type ConsoleBranding,
} from '@/lib/core'

// The example sets themselves live in core (graphAwareConfig) so all three
// apps stay in sync; this app only supplies branding. When the user is on a
// RoboLedger entity graph the console shows ledger examples (transactions,
// journal entries, trial balance), on the SEC repository it shows
// filing-analysis examples, and on a generic graph it shows structure-discovery
// examples.
const ROBOLEDGER_BRANDING: ConsoleBranding = {
  title: 'RoboLedger Console',
  consoleName: 'RoboLedger Console',
  gradientFrom: 'from-secondary-500',
  gradientTo: 'to-indigo-600',
  closingMessage: 'How can I help you analyze your financial data today?',
  mcp: {
    serverName: 'roboledger',
    packageName: '@roboledger/mcp',
    contextIdFallback: 'your_graph_id',
  },
  // A graph carrying both entity extensions reads as a ledger graph here.
  preferredKind: 'roboledger',
}

export default function ConsolePageContent() {
  const config = useGraphAwareConsoleConfig(ROBOLEDGER_BRANDING)
  return <ConsoleContent config={config} />
}
