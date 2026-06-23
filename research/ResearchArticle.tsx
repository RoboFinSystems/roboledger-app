import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { youtubeId } from './catalog'
import { CoverageHistory } from './CoverageHistory'
import type { CoverageItem } from './types'

/**
 * The full coverage report: native video, the brief rendered from markdown (its own
 * leading H1 is stripped — we render the title above it), the Q&A podcast, and the
 * continuing-coverage history. Works in a server component (SSR'd for SEO) or a client one.
 * Styled for a dark background — render inside a dark (`bg-black`/`.dark`) container.
 * The prose styling mirrors the blog article body so research reads consistently with it
 * (explicit `prose-invert` + element overrides rather than `dark:prose-invert`, which the
 * Tailwind v4 + typography-plugin setup in these apps does not resolve from a `.dark` class).
 */
export function ResearchArticle({
  item,
  briefMarkdown,
}: {
  item: CoverageItem
  briefMarkdown?: string
}) {
  const body = (briefMarkdown || '').replace(/^#\s.*(\r?\n)+/, '')
  const ytId = youtubeId(item.youtube_url)
  const podcastYtId = youtubeId(item.podcast_youtube_url)
  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-600 dark:text-cyan-400">
          {item.company} · {item.ticker}
        </span>
        {item.coverage_label && <span>{item.coverage_label}</span>}
        <span>{item.date?.slice(0, 10)}</span>
      </div>

      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        {item.title}
      </h1>

      {ytId ? (
        <div className="mb-8 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${ytId}`}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        item.assets.video && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            controls
            poster={item.assets.thumbnail}
            src={item.assets.video}
            className="mb-8 aspect-video w-full rounded-xl bg-black"
          />
        )
      )}

      {body && (
        <div className="prose prose-lg prose-invert prose-headings:font-heading prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 prose-strong:text-white prose-strong:font-semibold prose-code:text-cyan-400 prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-blockquote:border-l-cyan-500 prose-blockquote:text-gray-400 prose-blockquote:italic prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:marker:text-cyan-500 prose-table:border-gray-700 prose-th:bg-gray-900 prose-th:text-white prose-td:text-gray-300 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      )}

      {(item.assets.podcast_mp3 || podcastYtId) && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
            Listen — Q&amp;A podcast
          </h2>
          {item.assets.podcast_mp3 ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls src={item.assets.podcast_mp3} className="w-full" />
          ) : (
            // no MP3 yet — fall back to the YouTube video player
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${podcastYtId}`}
                title={`${item.title} — Q&A podcast`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
          {item.assets.podcast_mp3 && podcastYtId && (
            <a
              href={item.podcast_youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-cyan-600 hover:underline dark:text-cyan-400"
            >
              ▶ Watch the Q&amp;A on YouTube
            </a>
          )}
        </section>
      )}

      <CoverageHistory history={item.history} />
    </article>
  )
}
