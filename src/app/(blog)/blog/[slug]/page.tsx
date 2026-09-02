import { BlogJsonLd } from '@/components/blog/BlogJsonLd'
import { LOGIN_PATH, REGISTER_PATH } from '@/components/landing/constants'
import {
  formatPostDate,
  getAllPosts,
  getPostBySlug,
  getPostSlugs,
} from '@/lib/blog'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found | RoboLedger',
    }
  }

  const url = `https://roboledger.ai/blog/${slug}`
  return {
    title: `${post.title} | RoboLedger Blog`,
    description: post.metaDescription || post.excerpt,
    // Self-referencing canonical, unless the post declares an external one (syndication).
    alternates: { canonical: post.canonicalUrl || url },
    openGraph: {
      title: post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      url,
      publishedTime: post.date,
      authors: [post.author],
      // og:image comes from the generated opengraph-image.tsx in this segment.
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription || post.excerpt,
      // twitter:image comes from the generated twitter-image.tsx in this segment.
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const allPosts = await getAllPosts()
  const morePosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3)

  return (
    <article className="min-h-screen bg-black">
      <BlogJsonLd post={post} />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/blog"
              className="group hover:text-primary-400 inline-flex items-center text-gray-400 transition-colors"
            >
              <svg
                className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Link>

            <Link
              href={REGISTER_PATH}
              className="from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 rounded-full bg-linear-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>

          <h1 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <span className="text-primary-400">{post.author}</span>
            <span className="text-gray-600">•</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            {post.readingTime && (
              <>
                <span className="text-gray-600">•</span>
                <span>{post.readingTime}</span>
              </>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-800/50 px-3 py-1 text-sm text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {post.narrationUrl && (
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-primary-400 mb-2 text-sm font-semibold">
              Listen to this story
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio
              controls
              preload="none"
              src={post.narrationUrl}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-lg prose-invert prose-headings:font-heading prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary-400 prose-a:no-underline hover:prose-a:text-primary-300 prose-strong:text-white prose-strong:font-semibold prose-code:text-primary-400 prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-400 prose-blockquote:italic prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:marker:text-primary-500 prose-table:border-gray-700 prose-th:bg-gray-900 prose-th:text-white prose-td:text-gray-300 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || ''}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mx-auto max-w-4xl border-t border-gray-800 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="from-primary-500 to-secondary-500 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br text-xl font-bold text-white">
            {post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white">{post.author}</h3>
            <p className="mt-1 text-gray-400">
              Writing about what changes when accounting runs on a ledger Claude
              can query.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-primary-500/30 from-primary-500/10 via-secondary-500/10 to-accent-500/10 rounded-xl border bg-linear-to-br p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold text-white">
            See it on your own books
          </h3>
          <p className="mb-6 text-gray-300">
            Connect QuickBooks and ask Claude the first question. Nothing writes
            to QuickBooks until you post an entry. We close our own books this
            way.
          </p>
          <Link
            href={REGISTER_PATH}
            className="group from-primary-500 to-secondary-500 hover:shadow-primary-500/25 inline-flex items-center gap-2 rounded-full bg-linear-to-r px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg"
          >
            <span>Get Started</span>
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <p className="mt-6 text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href={LOGIN_PATH}
              className="text-primary-400 hover:text-primary-300"
            >
              Login
            </Link>
          </p>
        </div>
      </div>

      {morePosts.length > 0 && (
        <div className="border-t border-gray-800 bg-gray-900/30 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-white">
              More from the RoboLedger blog
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {morePosts.map((morePost) => (
                <Link
                  key={morePost.slug}
                  href={`/blog/${morePost.slug}`}
                  className="group hover:border-primary-500/50 rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:bg-gray-900/70"
                >
                  <h3 className="group-hover:text-primary-400 mb-2 font-bold text-white transition-colors">
                    {morePost.title}
                  </h3>
                  <p className="mb-2 text-sm text-gray-500">
                    {formatPostDate(morePost.date, 'short')}
                  </p>
                  <p className="line-clamp-2 text-sm text-gray-400">
                    {morePost.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
