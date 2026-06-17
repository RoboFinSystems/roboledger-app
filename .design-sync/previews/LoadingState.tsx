import { LoadingState } from '@robosystems/core'

/** The default content-area loader: a large spinner with a message below. */
export const WithMessage = () => (
  <div className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700">
    <LoadingState message="Loading your graphs…" />
  </div>
)

/** No message — a bare centered spinner reserving a content slot. */
export const SpinnerOnly = () => (
  <div className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700">
    <LoadingState />
  </div>
)

/** A smaller spinner for a compact section load. */
export const Small = () => (
  <div className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700">
    <LoadingState size="md" message="Fetching query results…" />
  </div>
)

/** A taller reserved area, e.g. while a dashboard panel hydrates. */
export const TallArea = () => (
  <div className="max-w-md rounded-lg border border-gray-200 dark:border-gray-700">
    <LoadingState
      size="xl"
      message="Connecting to repository…"
      className="h-64"
    />
  </div>
)
