'use client'

import { ConsoleContent, useGraphAwareConsoleConfig } from '@robosystems/core'

import { ROBOLEDGER_CONSOLE_BRANDING } from '@/lib/console-branding'

// When the user is on a RoboLedger entity graph the console shows ledger
// examples (transactions, journal entries, trial balance), on the SEC
// repository it shows filing-analysis examples, and on a generic graph it
// shows structure-discovery examples.
export default function ConsolePageContent() {
  const config = useGraphAwareConsoleConfig(ROBOLEDGER_CONSOLE_BRANDING)
  return <ConsoleContent config={config} />
}
