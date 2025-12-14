'use client'

import * as SDK from '@robosystems/client'
import { Button } from 'flowbite-react'
import React, { useEffect, useState } from 'react'
import { HiKey, HiPlusCircle } from 'react-icons/hi'
import { Spinner } from '../Spinner'
import { SettingsCard } from '../forms/SettingsCard'
import { StatusAlert } from '../forms/StatusAlert'
import type { ApiKey, ApiKeyWithValue } from '../types'
import { ApiKeyTable } from './ApiKeyTable'
import { CreateApiKeyModal } from './CreateApiKeyModal'

export interface ApiKeysCardProps {
  theme?: any
  className?: string
}

export const ApiKeysCard: React.FC<ApiKeysCardProps> = ({
  theme,
  className = '',
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Always use SDK
      const response = await SDK.listUserApiKeys()
      const sdkKeys = (response.data as any)?.api_keys || []

      // Map SDK response to component format
      const keys = sdkKeys.map((key: any) => ({
        id: key.id,
        name: key.name,
        graphId: key.graph_id,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
        expiresAt: key.expires_at,
        isActive: key.is_active ?? true,
        isSystem: key.is_system ?? false,
      }))

      setApiKeys(keys)
    } catch (err) {
      setError('Failed to load API keys. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateKey = async (data: {
    name: string
  }): Promise<ApiKeyWithValue> => {
    // Always use SDK to create key
    const response = await SDK.createUserApiKey({
      body: {
        name: data.name,
        description: `API key for ${data.name}`,
      },
    })

    await fetchApiKeys() // Refresh the list

    // Map SDK response to component format
    const responseData = response.data as any
    const apiKeyInfo = responseData?.api_key
    return {
      id: apiKeyInfo?.id || '',
      name: apiKeyInfo?.name || data.name,
      key: responseData?.key || '', // The actual API key value
      createdAt: apiKeyInfo?.created_at || new Date().toISOString(),
      lastUsedAt: apiKeyInfo?.last_used_at || null,
      expiresAt: null,
      isActive: apiKeyInfo?.is_active ?? true,
      isSystem: false,
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      // Always use SDK to revoke key
      await SDK.revokeUserApiKey({
        path: { api_key_id: keyId },
      })

      await fetchApiKeys() // Refresh the list
    } catch (err) {
      setError('Failed to revoke API key. Please try again.')
    }
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
    <SettingsCard
      title="API Keys"
      description="Manage your API keys for programmatic access"
      icon={HiKey}
      theme={theme?.card}
      className={className}
    >
      <div className="mb-4 flex items-center justify-end">
        <Button
          theme={theme?.button}
          color="blue"
          onClick={() => setIsOpenCreateModal(true)}
        >
          <HiPlusCircle className="mr-2 h-5 w-5" />
          Create API Key
        </Button>
      </div>

      {error && (
        <StatusAlert type="error" message={error} theme={theme?.alert} />
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="lg" />
        </div>
      ) : !Array.isArray(apiKeys) || apiKeys.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <HiKey className="mx-auto mb-3 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            No API keys yet
          </h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Create an API key to access your graphs programmatically
          </p>
          <Button
            theme={theme?.button}
            color="blue"
            onClick={() => setIsOpenCreateModal(true)}
            size="sm"
          >
            <HiPlusCircle className="mr-2 h-4 w-4" />
            Create Your First Key
          </Button>
        </div>
      ) : (
        <ApiKeyTable
          apiKeys={apiKeys}
          onRevokeKey={handleRevokeKey}
          theme={theme}
          formatDate={formatDate}
        />
      )}

      <CreateApiKeyModal
        isOpen={isOpenCreateModal}
        onClose={() => setIsOpenCreateModal(false)}
        onCreateKey={handleCreateKey}
        theme={theme}
      />
    </SettingsCard>
  )
}
