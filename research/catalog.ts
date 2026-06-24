// Data access for the research catalog. The catalog is a single public JSON file served
// via the CloudFront CDN, produced by `just reindex` in robosystems-content-machine.
// Fetched server-side (SSG/ISR) in the public site and client-side in the logged-in app.

import type { Catalog, CoverageItem } from './types'

export const CATALOG_URL =
  process.env.NEXT_PUBLIC_RESEARCH_CATALOG_URL ||
  'https://assets.robosystems.ai/content/index.json'

/** Fetch the full catalog. `revalidate` (seconds) drives Next ISR on the server. */
export async function fetchCatalog(revalidate = 3600): Promise<Catalog> {
  const res = await fetch(CATALOG_URL, { next: { revalidate } })
  if (!res.ok) throw new Error(`Research catalog fetch failed: ${res.status}`)
  return (await res.json()) as Catalog
}

/** All coverage items, newest first (the catalog is already sorted, but be defensive). */
export async function getAllCoverage(
  revalidate = 3600
): Promise<CoverageItem[]> {
  const { items } = await fetchCatalog(revalidate)
  return [...items].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

/** One company's coverage (latest + history), or null if not in the catalog. */
export async function getCoverage(
  ticker: string,
  revalidate = 3600
): Promise<CoverageItem | null> {
  const { items } = await fetchCatalog(revalidate)
  const t = ticker.toUpperCase()
  return items.find((i) => i.ticker.toUpperCase() === t) || null
}

/** Tickers for generateStaticParams(). */
export async function getCoverageTickers(): Promise<string[]> {
  const { items } = await fetchCatalog()
  return items.map((i) => i.ticker)
}

/** Fetch a brief's raw markdown (rendered to HTML by ResearchArticle). */
export async function fetchBrief(
  url: string,
  revalidate = 3600
): Promise<string> {
  const res = await fetch(url, { next: { revalidate } })
  if (!res.ok) throw new Error(`Brief fetch failed: ${res.status}`)
  return await res.text()
}

/** Extract a YouTube video id from a youtu.be / watch?v= / embed URL (or null). */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}
