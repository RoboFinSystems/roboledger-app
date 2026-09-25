import { describe, expect, it } from 'vitest'
import { SITE_DESCRIPTION, SITE_NAME } from '../site'
import { siteJsonLd, softwareJsonLd, websiteJsonLd } from '../structured-data'

describe('structured data', () => {
  // robosystems.ai declares this @id; every Robo* site names it as publisher.
  it('is published by the RoboSystems organization', () => {
    const orgId = 'https://robosystems.ai/#organization'
    expect(siteJsonLd['@graph'][0]['@id']).toBe(orgId)
    expect(websiteJsonLd.publisher['@id']).toBe(orgId)
    expect(softwareJsonLd.publisher['@id']).toBe(orgId)
  })

  it('keeps the site its own name', () => {
    expect(websiteJsonLd.name).toBe(SITE_NAME)
    expect(websiteJsonLd.description).toBe(SITE_DESCRIPTION)
  })
})
