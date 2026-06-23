// Shared types for the equity-research catalog produced by robosystems-content-machine
// (s3://robosystems-marketing-assets/content/index.json). The company is the durable
// entity; each run is a dated quarterly report version (latest + history[]).

export interface CoverageAssets {
  video?: string
  short?: string
  podcast_mp3?: string
  podcast_mp4?: string
  brief?: string
  thumbnail?: string
}

export interface CoverageVersion {
  version: string // e.g. "2026-Q1"
  date?: string // ISO date the report was published
  title?: string
  legacy_ticker?: string // e.g. TCNNF for Trulieve before the NYSE uplisting
  youtube_url?: string // captured by `just sync-youtube` (RSS title-match)
  assets: CoverageAssets
}

export interface CoverageItem {
  ticker: string
  company: string
  title: string
  summary: string
  tags: string[]
  campaign?: string | null
  campaign_slug?: string | null
  coverage_label?: string | null
  date: string // ISO date of the latest version
  version: string // e.g. "2026-Q2"
  // YouTube URLs captured by `just sync-youtube` — prefer these over the S3 MP4 (free egress).
  youtube_url?: string
  short_youtube_url?: string
  podcast_youtube_url?: string
  assets: CoverageAssets
  history: CoverageVersion[]
}

export interface Catalog {
  generated: string
  count: number
  items: CoverageItem[]
}
