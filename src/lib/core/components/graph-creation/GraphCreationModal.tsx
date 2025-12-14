'use client'

import { Button, Modal } from 'flowbite-react'
import { useState } from 'react'
import { HiPlus } from 'react-icons/hi'
import { customTheme } from '../../theme'
import { GraphCreationWizard } from './GraphCreationWizard'
import type { GraphCreationConfig } from './types'

interface GraphCreationModalProps extends GraphCreationConfig {
  buttonText?: string
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  buttonColor?: string
  showIcon?: boolean
  modalSize?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
}

export function GraphCreationModal({
  buttonText = 'Create Knowledge Graph',
  buttonSize = 'md',
  buttonColor = 'blue',
  showIcon = true,
  modalSize = '4xl',
  ...wizardProps
}: GraphCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = async (graphId: string) => {
    setIsOpen(false)
    if (wizardProps.onSuccess) {
      await wizardProps.onSuccess(graphId)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (wizardProps.onCancel) {
      wizardProps.onCancel()
    }
  }

  return (
    <>
      <Button
        theme={customTheme.button}
        color={buttonColor}
        size={buttonSize}
        onClick={() => setIsOpen(true)}
      >
        {showIcon && <HiPlus className="mr-2 -ml-1 h-5 w-5" />}
        {buttonText}
      </Button>

      <Modal
        theme={customTheme.modal}
        show={isOpen}
        onClose={handleCancel}
        size={modalSize}
      >
        <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 p-5 dark:border-gray-700">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Create New Knowledge Graph
          </h3>
          <button
            type="button"
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={handleCancel}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <GraphCreationWizard
            {...wizardProps}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Modal>
    </>
  )
}
