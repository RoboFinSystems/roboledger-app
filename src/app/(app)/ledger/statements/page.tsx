'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import LiveStatementsContent from './content'

export default function StatementsPage() {
  const { user, isLoading } = useUser()
  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }
  return <LiveStatementsContent />
}
