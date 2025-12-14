'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import ReportViewerContent from './content'

export default function ReportViewerPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <ReportViewerContent />
}
