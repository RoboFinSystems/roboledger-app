'use client'

import type { FC } from 'react'

interface DocsLinkProps {
  /** Path of the product-docs page, e.g. `/docs/month-end-close`. */
  href: string
}

/**
 * The one way an app page points at its product docs. The docs wear the public
 * site's chrome, so the link opens in a new tab and the page keeps its place.
 * Wording and styling live here so every surface reads the same — drop it at
 * the end of a page's subtitle or description, never as its own heading.
 */
const DocsLink: FC<DocsLinkProps> = ({ href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary-600 dark:text-primary-400 font-medium underline"
  >
    Read the guide →
  </a>
)

export default DocsLink
