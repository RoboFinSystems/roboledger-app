import { DeepResearchToggle } from '@robosystems/core'

/**
 * Enabled: the lightbulb glows yellow. The toggle is absolutely positioned, so
 * it lives inside a relative input-like surface (as it does in the chat composer).
 */
export const Enabled = () => (
  <div className="relative h-16 w-full max-w-xs rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <DeepResearchToggle isEnabled={true} onToggle={() => {}} />
    <span className="absolute top-3.5 left-10 text-sm text-gray-500 dark:text-gray-400">
      Deep research on
    </span>
  </div>
)

/** Disabled: muted gray lightbulb, the default resting state. */
export const Disabled = () => (
  <div className="relative h-16 w-full max-w-xs rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <DeepResearchToggle isEnabled={false} onToggle={() => {}} />
    <span className="absolute top-3.5 left-10 text-sm text-gray-500 dark:text-gray-400">
      Deep research off
    </span>
  </div>
)
