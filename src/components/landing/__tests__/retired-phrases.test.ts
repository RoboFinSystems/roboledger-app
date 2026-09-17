import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The landing page leads with the arc (connect, analyze, share, plan, compare) and puts
// the close last (specs/roboledger/landing-hero-arc.md). These phrases carried the old
// frame, close first and a speed claim, and a later copy edit must not bring them back.
// Case-insensitive on purpose: the H1 and the last band used different capitalisation.
// "hours, not days" is the bare form: the contrast section carried it without the "in".
// The last two are the pre-arc positioning, which outlived the hero in the social card,
// the JSON-LD and the manifest until 2026-09-16; those files are scanned too.
const RETIRED = [
  'close your books with ai',
  'a new way to close the books',
  'hours, not days',
  'faster close',
  'ai-native financial reporting',
  'natural language into complete',
]

const landingDir = path.resolve(__dirname, '..')
const files = [
  ...readdirSync(landingDir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map((f) => path.join(landingDir, f)),
  path.resolve(__dirname, '../../../app/(landing)/metadata.ts'),
  // Everything else that describes the homepage to a crawler or a shared link.
  ...[
    'app/layout.tsx',
    'app/manifest.ts',
    'app/opengraph-image.tsx',
    'lib/site.ts',
    'lib/structured-data.ts',
  ].map((f) => path.resolve(__dirname, '../../..', f)),
]

describe('landing copy', () => {
  it('scans the landing components and the page metadata', () => {
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((f) => f.endsWith('metadata.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('site.ts'))).toBe(true)
  })

  it.each(RETIRED)('no longer says "%s"', (phrase) => {
    const offenders = files.filter((f) =>
      readFileSync(f, 'utf8').toLowerCase().includes(phrase)
    )
    expect(offenders.map((f) => path.relative(landingDir, f))).toEqual([])
  })
})
