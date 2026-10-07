'use client'

import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import BankAccountsContent from './content'

export default function BankAccountsPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <BankAccountsContent />
}
