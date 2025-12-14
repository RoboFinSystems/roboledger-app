import { sidebarCookie, type SidebarCookie } from '@/lib/core'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { isCollapsed } = (await req.json()) as SidebarCookie

  sidebarCookie.set({ isCollapsed })

  return Response.json({})
}
