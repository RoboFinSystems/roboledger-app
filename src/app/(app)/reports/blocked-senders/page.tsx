'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import BlockedSendersContent from './content'

export default function BlockedSendersPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <BlockedSendersContent />
}
