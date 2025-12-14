'use client'

import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import ReportBuilderContent from './content'

export default function CreateReportPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <ReportBuilderContent />
}
