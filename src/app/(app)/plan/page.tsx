'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Suspense } from 'react'
import PlanContent from './content'

export default function PlanPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  // PlanContent reads ?scenario= via useSearchParams — must be inside
  // Suspense or Next will opt the entire route into client-side
  // rendering.
  return (
    <Suspense fallback={<Spinner size="xl" fullScreen />}>
      <PlanContent />
    </Suspense>
  )
}
