import { CoverageCard } from './CoverageCard'
import type { CoverageItem } from './types'

/** Responsive grid of coverage cards. */
export function CoverageGrid({
  items,
  hrefBase,
}: {
  items: CoverageItem[]
  hrefBase?: string
}) {
  if (!items.length) {
    return (
      <p className="py-12 text-center text-gray-500 dark:text-gray-400">
        No coverage yet — check back soon.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <CoverageCard key={item.ticker} item={item} hrefBase={hrefBase} />
      ))}
    </div>
  )
}
