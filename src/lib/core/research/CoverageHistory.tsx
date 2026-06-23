import type { CoverageVersion } from './types'

/** The continuing-coverage timeline: prior dated reports with links to their archived assets. */
export function CoverageHistory({ history }: { history: CoverageVersion[] }) {
  if (!history.length) return null
  return (
    <section className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Coverage history
      </h2>
      <ol className="space-y-3">
        {history.map((h) => (
          <li
            key={h.version}
            className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:gap-4 dark:border-gray-800"
          >
            <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {h.version}
            </span>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
              {h.title || 'Prior report'}
              {h.legacy_ticker && (
                <em className="text-gray-400"> (as {h.legacy_ticker})</em>
              )}
            </span>
            <span className="flex gap-3 text-xs">
              {(h.youtube_url || h.assets.video) && (
                <a
                  href={h.youtube_url || h.assets.video}
                  className="text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Video
                </a>
              )}
              {h.assets.podcast_mp3 && (
                <a
                  href={h.assets.podcast_mp3}
                  className="text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Podcast
                </a>
              )}
              {h.assets.brief && (
                <a
                  href={h.assets.brief}
                  className="text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Brief
                </a>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
