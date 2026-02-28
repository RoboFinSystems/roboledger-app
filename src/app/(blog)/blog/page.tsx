import VideoErrorBoundary from '@/components/common/VideoErrorBoundary'
import { getAllPosts } from '@/lib/blog'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'Blog | RoboSystems',
  description:
    'Insights on graph databases, AI-powered analytics, and the future of business intelligence',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with RoboSystems theme */}
      <div className="relative overflow-hidden">
        {/* Animated background matching landing page */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <div className="mb-6 flex items-center justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logos/robosystems.png"
                alt="RoboSystems Logo"
                width={60}
                height={60}
                className="mr-3"
              />
              <span className="font-heading text-4xl font-bold whitespace-nowrap text-white">
                RoboSystems
              </span>
            </Link>
          </div>

          <h1 className="font-heading text-center text-5xl font-bold md:text-6xl">
            <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Blog & Insights
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-300">
            Learn about the latest in graph databases, AI-powered analytics, and
            transformative business intelligence solutions.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-400">
              No blog posts yet. Check back soon for insights!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-cyan-500/10 group-hover:via-blue-500/10 group-hover:to-purple-500/10 group-hover:opacity-100" />

                {(post.coverVideo || post.coverImage) && (
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative h-48 overflow-hidden bg-gray-800">
                      {post.coverVideo ? (
                        <VideoErrorBoundary
                          fallbackImage={post.coverImage}
                          fallbackAlt={`Cover for ${post.title}`}
                        >
                          <video
                            src={post.coverVideo}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                          />
                        </VideoErrorBoundary>
                      ) : (
                        <Image
                          src={post.coverImage!}
                          alt={`Cover image for article: ${post.title}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      )}
                    </div>
                  </Link>
                )}

                <div className="relative p-6">
                  {post.featured && (
                    <span className="mb-3 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400">
                      Featured
                    </span>
                  )}

                  <h2 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-cyan-400">
                    <Link href={`/blog/${post.slug}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h2>

                  <div className="mb-3 flex items-center gap-3 text-sm text-gray-400">
                    <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
                    <span className="text-cyan-500">•</span>
                    <span>{post.readingTime}</span>
                  </div>

                  <p className="mb-4 line-clamp-3 text-gray-300">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      By {post.author}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
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
