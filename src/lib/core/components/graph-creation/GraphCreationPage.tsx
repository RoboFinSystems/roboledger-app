'use client'

import { Button } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { HiArrowLeft } from 'react-icons/hi'
import { customTheme } from '../../theme'
import { GraphCreationWizard } from './GraphCreationWizard'
import type { GraphCreationConfig } from './types'

interface GraphCreationPageProps extends GraphCreationConfig {
  title?: string
  backUrl?: string
}

export function GraphCreationPage({
  title = 'Create New Knowledge Graph',
  backUrl = '/home',
  ...wizardProps
}: GraphCreationPageProps) {
  const router = useRouter()

  const handleCancel = () => {
    router.push(backUrl)
    if (wizardProps.onCancel) {
      wizardProps.onCancel()
    }
  }

  const handleSuccess = async (graphId: string) => {
    if (wizardProps.onSuccess) {
      await wizardProps.onSuccess(graphId)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                theme={customTheme.button}
                color="gray"
                size="sm"
                outline
                onClick={handleCancel}
              >
                <HiArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <GraphCreationWizard
            {...wizardProps}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
            className="mx-auto max-w-3xl"
          />
        </div>
      </div>
    </div>
  )
}
