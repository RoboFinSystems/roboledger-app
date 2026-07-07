'use client'

import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  TextInput,
} from 'flowbite-react'
import { useEffect, useState } from 'react'

export type SyncOptions = {
  full_rebuild?: boolean
  since_date?: string
}

type Mode = 'incremental' | 'since_date' | 'full_rebuild'

interface SyncOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (options: SyncOptions) => void
  providerLabel: string
}

export default function SyncOptionsModal({
  isOpen,
  onClose,
  onSubmit,
  providerLabel,
}: SyncOptionsModalProps) {
  const [mode, setMode] = useState<Mode>('incremental')
  const [sinceDate, setSinceDate] = useState('')

  useEffect(() => {
    if (isOpen) {
      setMode('incremental')
      setSinceDate('')
    }
  }, [isOpen])

  const today = new Date().toISOString().slice(0, 10)
  const submitDisabled = mode === 'since_date' && !sinceDate

  const handleSubmit = () => {
    if (mode === 'incremental') {
      onSubmit({})
    } else if (mode === 'since_date') {
      onSubmit({ since_date: sinceDate })
    } else {
      onSubmit({ full_rebuild: true })
    }
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="lg">
      <ModalHeader>Sync {providerLabel}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Choose how much history to pull from the provider.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Radio
                id="sync-incremental"
                name="sync-mode"
                value="incremental"
                checked={mode === 'incremental'}
                onChange={() => setMode('incremental')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="sync-incremental" className="font-medium">
                  Last 60 days
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick incremental sync. Picks up recent changes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Radio
                id="sync-since-date"
                name="sync-mode"
                value="since_date"
                checked={mode === 'since_date'}
                onChange={() => setMode('since_date')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="sync-since-date" className="font-medium">
                  From a specific date
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pull all transactions on or after the chosen date.
                </p>
                {mode === 'since_date' && (
                  <TextInput
                    type="date"
                    value={sinceDate}
                    max={today}
                    onChange={(e) => setSinceDate(e.target.value)}
                    className="mt-2"
                    sizing="sm"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Radio
                id="sync-full-rebuild"
                name="sync-mode"
                value="full_rebuild"
                checked={mode === 'full_rebuild'}
                onChange={() => setMode('full_rebuild')}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="sync-full-rebuild" className="font-medium">
                  Full rebuild
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pull complete history from the provider.
                </p>
              </div>
            </div>
          </div>

          {mode === 'full_rebuild' && (
            <Alert color="warning" className="text-xs">
              Pulls every transaction from the provider. Can take several
              minutes for large companies.
            </Alert>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          Start Sync
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
