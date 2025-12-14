'use client'
import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import HomePageContent from './content'

export default function HomePage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <HomePageContent />
}
