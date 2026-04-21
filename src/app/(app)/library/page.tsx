'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import LibraryContent from './content'

export default function LibraryPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <LibraryContent />
}
