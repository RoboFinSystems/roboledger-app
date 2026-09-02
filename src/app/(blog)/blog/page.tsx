import { BLOG_DESCRIPTION, BlogListJsonLd } from '@/components/blog/BlogJsonLd'
import { REGISTER_PATH } from '@/components/landing/constants'
import { formatPostDate, getAllPosts } from '@/lib/blog'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const TITLE = 'Blog | RoboLedger'
const URL = 'https://roboledger.ai/blog'

export const metadata: Metadata = {
  title: TITLE,
  description: BLOG_DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: 'website',
    url: URL,
    siteName: 'RoboLedger',
    title: TITLE,
    description: BLOG_DESCRIPTION,
    // og:image comes from the generated opengraph-image.tsx in this segment.
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: BLOG_DESCRIPTION,
    // twitter:image comes from the generated twitter-image.tsx in this segment.
  },
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="min-h-screen bg-black">
      <BlogListJsonLd posts={posts} />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="from-primary-900/20 via-secondary-900/20 to-accent-900/20 absolute inset-0 bg-linear-to-br"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logos/roboledger.png"
                alt="RoboLedger Logo"
                width={60}
                height={60}
                className="mr-3"
              />
              <span className="font-heading text-4xl font-bold whitespace-nowrap text-white">
                RoboLedger
              </span>
            </Link>
          </div>

          <h1 className="font-heading text-center text-5xl font-bold md:text-6xl">
            <span className="from-primary-400 via-secondary-400 to-accent-400 bg-linear-to-r bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-300">
            {BLOG_DESCRIPTION}
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href={REGISTER_PATH}
              className="from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 rounded-lg bg-linear-to-r px-6 py-3 text-sm font-medium text-white shadow-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-400">
              No posts yet. The first one is on its way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group hover:border-primary-500/50 hover:shadow-primary-500/10 relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
              >
                <div className="from-primary-500/0 via-secondary-500/0 to-accent-500/0 group-hover:from-primary-500/10 group-hover:via-secondary-500/10 group-hover:to-accent-500/10 absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative p-6">
                  <h2 className="group-hover:text-primary-400 mb-3 text-xl font-bold text-white transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h2>

                  <div className="mb-3 flex items-center gap-3 text-sm text-gray-400">
                    <span>{formatPostDate(post.date, 'short')}</span>
                    {post.readingTime && (
                      <>
                        <span className="text-primary-500">•</span>
                        <span>{post.readingTime}</span>
                      </>
                    )}
                  </div>

                  <p className="mb-4 line-clamp-3 text-gray-300">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      By {post.author}
                    </span>
                    <div className="text-primary-400 group-hover:text-primary-300 flex items-center gap-1 text-sm font-medium transition-colors">
                      Read more
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
