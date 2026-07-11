'use client'
import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import ModernConnectionsContent from './content'

export default function CompanyConnectionsPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <ModernConnectionsContent />
}
