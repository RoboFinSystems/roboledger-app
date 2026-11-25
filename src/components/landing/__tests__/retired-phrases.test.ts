import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// Phrases the landing copy carried before and must not bring back. Case-insensitive on
// purpose: the H1 and the last band used different capitalisation. "hours, not days" is
// the bare form: the contrast section carried it without the "in".
// The first group is the close-first, speed-claim frame. The pre-arc positioning outlived
// the hero in the social card, the JSON-LD and the manifest until 2026-09-16, so those
// files are scanned too.
// Then Harbinger FinLab's old offers. First a team that ran the customer's close; then
// implementation and training, with a referral to a practice that would keep the books.
// Since 2026-11-16 FinLab sells one thing on this page, the Finance AI Deployment, and never
// holds the pen: setup is a screenshare the customer controls (its MSA, 2.2 and 4.1), and
// the product cannot add one person to many customers' orgs.
// The inbox has no autopilot a visitor could switch on (the only autopilot is a per-graph
// promotion flag with no screen). A group's statements are consolidated, not combined, and
// the assistant drafts the consolidating entries for a person to post, so the system never
// consolidates on its own; only the parent's QuickBooks company connects (gtm/plan.md §5).
// The 2026-11-16 positioning pass (vault: gtm/content/positioning.md) retired the
// close-last arc and the peer claim the page could not show: peers are public companies
// the reader chooses. A bare "bookkeeper" is deliberately absent, because Spotlights says
// "not the bookkeeper" in a comment and this test reads comments too.
const RETIRED = [
  'close your books with ai',
  'a new way to close the books',
  'hours, not days',
  'faster close',
  'ai-native financial reporting',
  'natural language into complete',
  'done for you',
  'done-for-you',
  'co-sourced',
  'controllership',
  'run it for you',
  'run your close for you',
  'run for you by',
  'embedded in your close',
  'managed operations',
  'outcome-based',
  'our access ends',
  'leave the graph',
  'have it run for you',
  'whoever signs off',
  'already sign off',
  'enable autopilot',
  'statements combine them',
  'the system consolidates',
  'all your quickbooks companies',
  'close comes last',
  'practice that runs',
  'public companies in your industry',
  'train your staff',
  'trains your staff',
  'get your team trained',
  'trains them',
  // 2026-11-24: the hero H1 moved to the 11-18 lock, and the firm buyer (out of outbound
  // since 11-18) left the FAQ and the agent surface.
  'ai accounting software you own',
  'fractional cfo',
  'cpa firm',
  'client you look after',
  'finance ai that ties to your books',
]

// Retired from what a visitor reads, but fair to name in a comment that explains the
// change, so comments are stripped before these are matched. "AI-native" leads nowhere
// in search (vault: gtm/content/positioning.md §2) and left the footer tagline 2026-11-16.
// The offer was renamed the same day from "Pilot", which read as both a proof of concept
// and a copilot, to the Finance AI Deployment; "pilot" matches as a word, so autopilot and
// copilot still pass. The 2026-11-16 alignment review added the rest: the old ontology
// phrasings ("XBRL-shaped", "in one model", "serialized as RDF"), RoboLedger as a
// "reference app", licence and customer claims the positioning never makes, any scheduler link
// but the public intro-meeting page, the em dash, and "Get
// Started" as a button label.
const RETIRED_IN_COPY: (string | RegExp)[] = [
  'ai-native',
  'finance ai pilot',
  /\bpilot\b/,
  'xbrl-shaped',
  'in one model',
  'serialized as rdf',
  'reference app',
  'all apache',
  'customers run',
  'not raising',
  /scheduler\.zoom\.us\/[\w-]+\/(?!intro-meeting(?![\w-]))[\w-]+/,
  '\u2014',
  />\s*get started\s*</,
]

function says(source: string, phrase: string | RegExp): boolean {
  const text = withoutComments(source).toLowerCase()
  return typeof phrase === 'string' ? text.includes(phrase) : phrase.test(text)
}

// Drops block comments (JSX `{/* */}` included) and `//` line comments, leaving the
// `//` inside a URL such as https:// alone.
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const landingDir = path.resolve(__dirname, '..')
const demosDir = path.resolve(__dirname, '../../../../public/demos')
const files = [
  ...readdirSync(landingDir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map((f) => path.join(landingDir, f)),
  path.resolve(__dirname, '../../../app/(landing)/metadata.ts'),
  // The animated demos carry landing copy of their own.
  ...readdirSync(demosDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(demosDir, f)),
  // Everything else that describes the homepage to a crawler or a shared link.
  ...[
    'app/layout.tsx',
    'app/manifest.ts',
    'app/opengraph-image.tsx',
    'lib/site.ts',
    'lib/structured-data.ts',
    'app/(pages)/quickbooks-mcp/page.tsx',
    'app/(landing)/register/page.tsx',
    'components/blog/BlogJsonLd.tsx',
    'app/(blog)/blog/opengraph-image.tsx',
    'app/(blog)/blog/[slug]/page.tsx',
    'app/llms.txt/route.ts',
    'app/(blog)/blog/page.tsx',
    'app/(pages)/quickbooks-mcp/opengraph-image.tsx',
    'lib/product-pages.ts',
  ].map((f) => path.resolve(__dirname, '../../..', f)),
  // The redirect to the scheduler, and the repo's own front page.
  ...['next.config.js', 'README.md'].map((f) =>
    path.resolve(__dirname, '../../../..', f)
  ),
]

describe('landing copy', () => {
  it('scans the landing components and the page metadata', () => {
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((f) => f.endsWith('metadata.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('site.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('hero.js'))).toBe(true)
    expect(files.some((f) => f.endsWith('next.config.js'))).toBe(true)
    expect(files.some((f) => f.endsWith('README.md'))).toBe(true)
  })

  it.each(RETIRED)('no longer says "%s"', (phrase) => {
    const offenders = files.filter((f) =>
      readFileSync(f, 'utf8').toLowerCase().includes(phrase)
    )
    expect(offenders.map((f) => path.relative(landingDir, f))).toEqual([])
  })

  it.each(RETIRED_IN_COPY)('no longer says %s in page copy', (phrase) => {
    const offenders = files.filter((f) => says(readFileSync(f, 'utf8'), phrase))
    expect(offenders.map((f) => path.relative(landingDir, f))).toEqual([])
  })

  it('matches pilot as a word and Get Started only as a label', () => {
    expect(says("label: 'The pilot'", /\bpilot\b/)).toBe(true)
    expect(says('autopilot and copilot', /\bpilot\b/)).toBe(false)
    expect(says('<span>Get Started</span>', />\s*get started\s*</)).toBe(true)
    expect(
      says('Connect QuickBooks to get started', />\s*get started\s*</)
    ).toBe(false)
  })

  it('reads comments out before matching page copy', () => {
    const source = [
      '// AI-native was the old word',
      '/* AI-native too */',
      "const url = 'https://roboledger.ai'",
    ].join('\n')
    expect(withoutComments(source).toLowerCase()).not.toContain('ai-native')
    expect(withoutComments(source)).toContain('https://roboledger.ai')
  })
})
