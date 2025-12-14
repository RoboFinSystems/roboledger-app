'use server'

import { graphCookie } from '../lib/graph-cookie'

export async function persistGraphSelection(graphId: string): Promise<void> {
  await graphCookie.set({ graphId })
}

export async function clearGraphSelection(): Promise<void> {
  await graphCookie.delete()
}

export async function getGraphSelection(): Promise<string | null> {
  const cookie = await graphCookie.get()
  return cookie?.graphId ?? null
}
