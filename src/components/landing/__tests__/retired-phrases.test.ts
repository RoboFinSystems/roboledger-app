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
// The rest are Harbinger FinLab's old offer: a team that ran the customer's close. FinLab
// implements and trains; it never holds the pen (harbinger.finance, recut 2026-08-28).
// Nor does it sign in and hand access back later: setup is a screenshare (its MSA,
// 2.2 and 4.1), and the product cannot add one person to many customers' orgs.
// "Have it run for you" was the old CTA to that team. The two "sign off" forms cast the
// operator as only the approver; FinLab trains the people who work in it every day, from
// the AI chat they already use (recut 2026-09-18).
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
