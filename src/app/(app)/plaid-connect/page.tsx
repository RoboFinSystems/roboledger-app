'use client'
import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import PlaidConnectContent from './content'

export default function PlaidConnectPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <PlaidConnectContent />
}
