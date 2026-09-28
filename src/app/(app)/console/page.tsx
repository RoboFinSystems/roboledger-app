'use client'

import { openConsoleDrawer } from '@robosystems/core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// The console lives in the bottom drawer on every page. This route stays so
// old links and bookmarks still land on it: open the drawer, go home.
export default function ConsolePage() {
  const router = useRouter()

  useEffect(() => {
    openConsoleDrawer()
    router.replace('/home')
  }, [router])

  return null
}
