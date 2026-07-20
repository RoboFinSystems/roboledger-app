'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Suspense } from 'react'
import AnalyticsContent from './content'

export default function AnalyticsPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  // AnalyticsContent reads ?block= / ?view= via useSearchParams — must be
  // inside Suspense or Next will opt the entire route into client-side
  // rendering.
  return (
    <Suspense fallback={<Spinner size="xl" fullScreen />}>
      <AnalyticsContent />
    </Suspense>
  )
}
