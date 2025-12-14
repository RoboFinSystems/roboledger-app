'use client'
import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import ConsolePageContent from './content'

export default function ConsolePage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <ConsolePageContent />
}
