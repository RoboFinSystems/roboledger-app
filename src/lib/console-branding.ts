import type { ConsoleBranding } from '@robosystems/core'

// The example sets themselves live in core (graphAwareConfig) so all three
// apps stay in sync; this app only supplies branding. Shared by the console
// page and the console drawer.
export const ROBOLEDGER_CONSOLE_BRANDING: ConsoleBranding = {
  title: 'RoboLedger Console',
  consoleName: 'RoboLedger Console',
  gradientFrom: 'from-secondary-500',
  gradientTo: 'to-indigo-600',
  closingMessage: 'How can I help you analyze your financial data today?',
  mcp: {
    serverName: 'roboledger',
    contextIdFallback: 'your_graph_id',
  },
  // A graph carrying both entity extensions reads as a ledger graph here.
  preferredKind: 'roboledger',
}
