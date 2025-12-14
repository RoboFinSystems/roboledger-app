'use client'

import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import React, { useState } from 'react'
import { Spinner } from '../Spinner'
import { SettingsFormField } from '../forms/SettingsFormField'
import { StatusAlert } from '../forms/StatusAlert'
import type { ApiKeyWithValue } from '../types'
import { ApiKeyDisplay } from './ApiKeyDisplay'

export interface CreateApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateKey: (data: { name: string }) => Promise<ApiKeyWithValue>
  theme?: any
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  isOpen,
  onClose,
  onCreateKey,
  theme,
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newApiKey, setNewApiKey] = useState<ApiKeyWithValue | null>(null)
  const [keyName, setKeyName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const result = await onCreateKey({
        name: keyName,
      })

      setNewApiKey(result)
    } catch (err) {
      setError('Failed to create API key. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    onClose()
    setKeyName('')
    setNewApiKey(null)
    setError(null)
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Modal theme={theme?.modal} show={isOpen} onClose={handleCloseModal}>
      <ModalHeader>Create API Key</ModalHeader>
      <ModalBody>
        {newApiKey ? (
          <div>
            <StatusAlert
              type="success"
              message="Your API key has been created."
              theme={theme?.alert}
            />

            <div className="mb-4 space-y-4">
              <ApiKeyDisplay
                label="ROBOSYSTEMS_API_KEY"
                value={newApiKey.key}
                keyId={newApiKey.id}
                theme={theme}
              />

              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                ⚠️ Important: Save this API key somewhere safe. For security
                reasons, you cannot view it again after closing this dialog.
              </p>
            </div>

            <div className="mb-2">
              <Label theme={theme?.label} htmlFor="keyDetails">
                Key Details
              </Label>
              <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Name:
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {newApiKey.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Created:
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatDate(newApiKey.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Status:
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <SettingsFormField
              id="keyName"
              label="API Key Name"
              placeholder="My API Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
              theme={theme}
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Give your API key a memorable name to identify it later
            </p>

            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> API keys do not expire by date. Keys that
                haven't been used for 90 days will be automatically deactivated
                for security.
              </p>
            </div>

            {error && (
              <StatusAlert type="error" message={error} theme={theme?.alert} />
            )}
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        {newApiKey ? (
          <Button theme={theme?.button} color="blue" onClick={handleCloseModal}>
            Done
          </Button>
        ) : (
          <>
            <Button
              theme={theme?.button}
              color="gray"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              theme={theme?.button}
              color="primary"
              onClick={handleSubmit}
              disabled={isCreating || !keyName}
            >
              {isCreating ? <Spinner size="sm" /> : 'Create API Key'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
