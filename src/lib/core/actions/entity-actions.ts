'use server'

import { entityCookie } from '../lib/entity-cookie'
import type { Entity } from '../types'

export async function persistEntitySelection(
  entity: Entity,
  graphId: string
): Promise<void> {
  await entityCookie.set({
    identifier: entity.identifier,
    name: entity.name,
    graphId,
  })
}

export async function clearEntitySelection(): Promise<void> {
  await entityCookie.delete()
}

export async function getEntitySelection(): Promise<{
  identifier: string
  name: string
  graphId: string
} | null> {
  const cookie = await entityCookie.get()
  return cookie ?? null
}
