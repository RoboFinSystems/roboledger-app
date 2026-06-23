import Link from 'next/link'
import type { CoverageItem } from './types'

/**
 * A coverage tile: full-bleed thumbnail on top, then ticker/label, title, summary, and
 * prior-report count. Self-contained (not the shared Flowbite Card) so the cover image
 * sits flush at the top of every card regardless of how much text each one has — the
 * shared card theme centers its content (`justify-center`), which left the covers at
 * different heights across a row.
 */
export function CoverageCard({
  item,
  hrefBase = '/research',
}: {
  item: CoverageItem
  hrefBase?: string
}) {
  return (
    <Link
      href={`${hrefBase}/${item.ticker.toLowerCase()}`}
      className="group block h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white/80 shadow-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-zinc-950">
        {item.assets.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.assets.thumbnail}
            alt={item.title}
            className="aspect-video w-full object-cover"
          />
        )}
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-600 dark:text-cyan-400">
              {item.ticker}
            </span>
            {item.coverage_label && <span>{item.coverage_label}</span>}
            <span className="ml-auto">{item.date?.slice(0, 10)}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
            {item.title}
          </h3>
          <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
            {item.summary}
          </p>
          {item.history.length > 0 && (
            <p className="mt-auto pt-1 text-xs text-gray-400">
              +{item.history.length} prior{' '}
              {item.history.length === 1 ? 'report' : 'reports'}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
