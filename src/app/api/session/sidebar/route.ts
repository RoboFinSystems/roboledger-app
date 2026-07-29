import { sidebarCookie, type SidebarCookie } from '@robosystems/core'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  let body: SidebarCookie
  try {
    body = (await req.json()) as SidebarCookie
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  sidebarCookie.set({ isCollapsed: Boolean(body?.isCollapsed) })

  return Response.json({})
}
