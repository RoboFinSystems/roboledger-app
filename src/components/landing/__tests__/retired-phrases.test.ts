import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The landing page leads with the arc (connect, analyze, share, plan, compare) and puts
// the close last (specs/roboledger/landing-hero-arc.md). These phrases carried the old
// frame, close first and a speed claim, and a later copy edit must not bring them back.
// Case-insensitive on purpose: the H1 and the last band used different capitalisation.
const RETIRED = ['close your books with ai', 'in hours, not days']

const landingDir = path.resolve(__dirname, '..')
const files = [
  ...readdirSync(landingDir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
    .map((f) => path.join(landingDir, f)),
  path.resolve(__dirname, '../../../app/(landing)/metadata.ts'),
]

describe('landing copy', () => {
  it('scans the landing components and the page metadata', () => {
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((f) => f.endsWith('metadata.ts'))).toBe(true)
  })

  it.each(RETIRED)('no longer says "%s"', (phrase) => {
    const offenders = files.filter((f) =>
      readFileSync(f, 'utf8').toLowerCase().includes(phrase)
    )
    expect(offenders.map((f) => path.relative(landingDir, f))).toEqual([])
  })
})
