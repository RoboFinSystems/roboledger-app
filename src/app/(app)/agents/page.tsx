'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Suspense } from 'react'
import AgentsContent from './content'

export default function AgentsPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  // AgentsContent reads ?id= via useSearchParams — must be inside Suspense
  // or Next will opt the entire route into client-side rendering.
  return (
    <Suspense fallback={<Spinner size="xl" fullScreen />}>
      <AgentsContent />
    </Suspense>
  )
}
