'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import ReceivablesPayablesContent from './content'

export default function ReceivablesPayablesPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <ReceivablesPayablesContent />
}
