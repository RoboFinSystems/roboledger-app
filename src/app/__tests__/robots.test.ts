import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import robots from '../robots'

// Every page in the (app) route group sits behind sign-in, so each top-level segment
// belongs in the disallow list. Reading the route groups rather than a hand-kept list
// means a new signed-in page fails here until robots.ts names it.
//
// Rules match by prefix, so each entry is the bare segment: '/home/' blocks /home/x
// but leaves /home itself crawlable. The bare form cuts the other way too — '/home'
// would also block a public /homepage — so the public route groups are checked for
// overlap.
const appDir = join(dirname(fileURLToPath(import.meta.url)), '..')

function directories(path: string) {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '__tests__')
    .map((entry) => entry.name)
}

const signedInSegments = directories(join(appDir, '(app)'))
const publicSegments = directories(appDir)
  .filter((name) => name.startsWith('(') && name !== '(app)')
  .flatMap((group) => directories(join(appDir, group)))

describe('robots', () => {
  const disallow: string[] = [robots().rules]
    .flat()
    .flatMap((rule) => [rule.disallow ?? []].flat())

  it.each(signedInSegments)(
    'keeps crawlers off the signed-in /%s route',
    (segment) => {
      expect(disallow).toContain(`/${segment}`)
    }
  )

  it('names each section bare, so its own page is covered', () => {
    expect(disallow.filter((path) => path.endsWith('/'))).toEqual([])
  })

  it.each(publicSegments)(
    'leaves the public /%s route crawlable',
    (segment) => {
      const blocking = disallow.filter(
        (path) =>
          `/${segment}`.startsWith(path) || path.startsWith(`/${segment}/`)
      )
      expect(blocking).toEqual([])
    }
  )
})
