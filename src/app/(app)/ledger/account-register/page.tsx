'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Suspense } from 'react'
import AccountRegisterContent from './content'

export default function AccountRegisterPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  // The content reads the account and window from the URL with
  // useSearchParams, which must render inside Suspense.
  return (
    <Suspense fallback={<Spinner size="xl" fullScreen />}>
      <AccountRegisterContent />
    </Suspense>
  )
}
