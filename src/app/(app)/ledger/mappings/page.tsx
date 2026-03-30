'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import MappingsContent from './content'

export default function MappingsPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <MappingsContent />
}
