import { ProgressiveText } from '@robosystems/core'

/** A line of agent prose, revealed character-by-character like a streaming response. */
export const AgentResponse = () => (
  <div className="max-w-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300">
    <ProgressiveText text="I found 3 connected entities sharing the same registered address. Two filed 10-K reports in the last fiscal year, and one has an outstanding intercompany loan of $1.2M." />
  </div>
)

/** Streaming terminal output — rendered in a console surface with a monospace face. */
export const ConsoleOutput = () => (
  <div className="max-w-xl rounded-lg bg-gray-900 p-4 font-mono text-xs leading-relaxed whitespace-pre-line text-green-400">
    <ProgressiveText
      text={
        "> MATCH (c:Entity)-[:HAS_FILING]->(f:Filing)\n> WHERE f.type = '10-K' RETURN c.name, f.period\n✓ 42 rows returned in 38ms"
      }
    />
  </div>
)

/** A short status line — the kind of progress note shown while a query runs. */
export const StatusLine = () => (
  <div className="text-primary-600 max-w-xl text-sm font-medium">
    <ProgressiveText text="Analyzing graph schema and resolving 1,284 relationships…" />
  </div>
)
