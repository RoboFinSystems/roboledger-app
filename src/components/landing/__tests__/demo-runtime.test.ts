import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// public/demos/runtime.js is committed so the page and the content machine's
// renderer load it with no build step. It must stay byte-identical to the one
// @robosystems/core ships: after bumping core, run `npm run sync:demos`.
describe('landing demo runtime', () => {
  it('matches the installed @robosystems/core', () => {
    const require = createRequire(import.meta.url)
    const core = path.join(
      path.dirname(require.resolve('@robosystems/core/package.json')),
      'demos/runtime.js'
    )
    const committed = path.resolve(
      __dirname,
      '../../../../public/demos/runtime.js'
    )
    expect(readFileSync(committed, 'utf8')).toBe(readFileSync(core, 'utf8'))
  })
})
