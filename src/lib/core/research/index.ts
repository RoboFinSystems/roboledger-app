// Research portal module — shared across robosystems-app (public/SEO) and
// roboinvestor-app (logged-in). Data layer reads the S3 catalog produced by
// robosystems-content-machine; components render the coverage + continuing-coverage thread.

export {
  CATALOG_URL,
  fetchBrief,
  fetchCatalog,
  getAllCoverage,
  getCoverage,
  getCoverageTickers,
  youtubeId,
} from './catalog'
export { CoverageCard } from './CoverageCard'
export { CoverageGrid } from './CoverageGrid'
export { CoverageHistory } from './CoverageHistory'
export { ResearchArticle } from './ResearchArticle'
export * from './types'
