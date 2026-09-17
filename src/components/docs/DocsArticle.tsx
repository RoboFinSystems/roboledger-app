import {
  descriptionRepeatsBody,
  docsNeighbors,
  tableOfContents,
  type DocsNav,
  type DocsPage,
} from '@/lib/docs'
import Link from 'next/link'
import { DocsJsonLd, type Crumb } from './DocsJsonLd'
import { DocsMarkdown } from './DocsMarkdown'

const PROSE =
  'prose prose-invert max-w-none prose-headings:font-heading prose-headings:scroll-mt-28 prose-headings:text-white prose-p:text-gray-300 prose-a:text-primary-400 prose-a:no-underline hover:prose-a:text-primary-300 prose-strong:text-white prose-code:text-primary-300 prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-gray-800 prose-pre:bg-gray-900 prose-li:text-gray-300 prose-li:marker:text-primary-500 prose-th:text-white prose-td:text-gray-300 prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-400'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function SidebarLinks({ nav, current }: { nav: DocsNav; current: string }) {
  const item = (page: DocsPage, label = page.title) => {
    const active = page.slug === current
    return (
      <li key={page.slug}>
        <Link
          href={page.path}
          aria-current={active ? 'page' : undefined}
          className={`block rounded px-2 py-1 transition-colors ${
            active
              ? 'bg-primary-500/10 text-primary-300'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </Link>
      </li>
    )
  }
  return (
    <div className="space-y-6 text-sm">
      {nav.index && <ul>{item(nav.index, 'Overview')}</ul>}
      {nav.sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title && (
            <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">{section.pages.map((p) => item(p))}</ul>
        </div>
      ))}
    </div>
  )
}

/**
 * One docs page: the collection's sidebar, the rendered body with its title, date and
 * source link, an on-this-page list, and previous/next links in sidebar order.
 */
export function DocsArticle({
  nav,
  page,
  body,
  crumbs,
  collectionTitle,
  baseUrl,
}: {
  nav: DocsNav
  page: DocsPage
  body: string
  crumbs: Crumb[]
  collectionTitle: string
  baseUrl?: string
}) {
  const headings = tableOfContents(body)
  const { previous, next } = docsNeighbors(nav, page.slug)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <DocsJsonLd page={page} crumbs={crumbs} baseUrl={baseUrl} />
      <div className="flex gap-10">
        <nav
          aria-label={collectionTitle}
          className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 self-start overflow-y-auto pb-8 lg:block"
        >
          <SidebarLinks nav={nav} current={page.slug} />
        </nav>

        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((crumb, i) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {i < crumbs.length - 1 ? (
                    <Link href={crumb.path} className="hover:text-primary-400">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="text-gray-300">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <details className="mb-8 rounded-lg border border-gray-800 bg-gray-900/50 p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-gray-300">
              Browse {collectionTitle.toLowerCase()}
            </summary>
            <div className="mt-4">
              <SidebarLinks nav={nav} current={page.slug} />
            </div>
          </details>

          <article>
            <header className="mb-10 border-b border-gray-800 pb-8">
              <h1 className="font-heading text-4xl font-bold text-white md:text-5xl">
                {page.title}
              </h1>
              {page.description &&
                !descriptionRepeatsBody(page.description, body) && (
                  <p className="mt-4 text-lg text-gray-400">
                    {page.description}
                  </p>
                )}
            </header>

            <div className={PROSE}>
              <DocsMarkdown>{body}</DocsMarkdown>
            </div>

            <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 pt-6 text-sm text-gray-500">
              {page.updated ? (
                <span>
                  Last updated{' '}
                  <time dateTime={page.updated}>
                    {formatDate(page.updated)}
                  </time>
                </span>
              ) : (
                <span />
              )}
              <a
                href={page.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-400"
              >
                Edit this page on GitHub
              </a>
            </footer>
          </article>

          {(previous || next) && (
            <nav
              aria-label="Previous and next pages"
              className="mt-10 grid gap-4 sm:grid-cols-2"
            >
              {previous ? (
                <Link
                  href={previous.path}
                  className="hover:border-primary-500/50 rounded-lg border border-gray-800 p-4 transition-colors"
                >
                  <span className="block text-xs text-gray-500">Previous</span>
                  <span className="text-white">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={next.path}
                  className="hover:border-primary-500/50 rounded-lg border border-gray-800 p-4 text-right transition-colors"
                >
                  <span className="block text-xs text-gray-500">Next</span>
                  <span className="text-white">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        {headings.length > 1 && (
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-56 shrink-0 self-start overflow-y-auto text-sm xl:block">
            <p className="mb-3 font-semibold text-gray-300">On this page</p>
            <ul className="space-y-1.5">
              {headings.map((h) => (
                <li key={h.id} className={h.depth === 3 ? 'ml-3' : undefined}>
                  <a
                    href={`#${h.id}`}
                    className="hover:text-primary-400 text-gray-500 transition-colors"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}
