'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import TrialBalanceContent from './content'

export default function TrialBalancePage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <TrialBalanceContent />
}
