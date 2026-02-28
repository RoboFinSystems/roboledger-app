'use client'

import { customTheme } from '@/lib/core'
import { Alert, Badge, Button, Card, Progress } from 'flowbite-react'
import Image from 'next/image'
import { FaTrash } from 'react-icons/fa'
import {
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiRefresh,
} from 'react-icons/hi'

const PROVIDER_IMAGES: Record<string, { src: string; alt: string }> = {
  quickbooks: { src: '/images/qb_connect.png', alt: 'QuickBooks' },
  sec: { src: '/images/sec_connect.png', alt: 'SEC EDGAR' },
}

const PROVIDER_LABELS: Record<string, string> = {
  quickbooks: 'QuickBooks',
  sec: 'SEC EDGAR',
}

export interface ConnectionStatus {
  status: string
  message: string
  progress?: number
  step?: string
  error?: string
}

export interface ConnectionData {
  connection_id: string
  provider: string
  entity_id?: string | null
  status: string
  created_at: string
  updated_at?: string | null
  last_sync?: string | null
  metadata: Record<string, any>
}

interface ConnectionCardProps {
  connection: ConnectionData
  status: ConnectionStatus
  onSync: () => void
  onDelete: () => void
}

function getStatusColor(status: string) {
  switch (status) {
    case 'connected':
    case 'completed':
      return 'success'
    case 'syncing':
    case 'in_progress':
    case 'pending':
    case 'pending_oauth':
      return 'warning'
    case 'error':
    case 'failed':
      return 'failure'
    default:
      return 'gray'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
    case 'completed':
      return HiCheckCircle
    case 'syncing':
    case 'in_progress':
    case 'pending':
    case 'pending_oauth':
      return HiClock
    case 'error':
    case 'failed':
      return HiExclamationCircle
    default:
      return undefined
  }
}

const isSyncing = (status: string) =>
  status === 'syncing' || status === 'in_progress' || status === 'pending'

export default function ConnectionCard({
  connection,
  status,
  onSync,
  onDelete,
}: ConnectionCardProps) {
  const provider = connection.provider.toLowerCase()
  const image = PROVIDER_IMAGES[provider]
  const label = PROVIDER_LABELS[provider] || connection.provider

  // Provider-specific subtitle
  const subtitle =
    provider === 'sec'
      ? connection.metadata?.cik
        ? `CIK: ${connection.metadata.cik}`
        : null
      : connection.metadata?.entity_name
        ? `Company: ${connection.metadata.entity_name}`
        : null

  return (
    <Card theme={customTheme.card}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {image && (
            <Image
              src={image.src}
              alt={image.alt}
              width={60}
              height={32}
              className="rounded"
            />
          )}

          <div className="flex-1">
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              {label} Integration
            </h3>

            <div className="mb-2 flex items-center gap-2">
              <Badge
                color={getStatusColor(status.status)}
                icon={getStatusIcon(status.status)}
                className="flex items-center gap-1"
              >
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </Badge>
            </div>

            {subtitle && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{subtitle}</p>
              </div>
            )}

            {connection.metadata?.entity_name && provider === 'sec' && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Entity: {connection.metadata.entity_name}</p>
              </div>
            )}

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {status.message}
            </p>

            {status.step && (
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                Current step: {status.step}
              </p>
            )}

            {status.progress !== undefined && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Math.round(status.progress)}%
                  </span>
                </div>
                <Progress progress={status.progress} color="blue" />
              </div>
            )}

            {status.error && (
              <Alert color="failure" className="mt-3">
                {status.error}
              </Alert>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            color="primary"
            theme={customTheme.button}
            onClick={onSync}
            disabled={isSyncing(status.status)}
          >
            <HiRefresh className="mr-2 h-4 w-4" />
            {isSyncing(status.status) ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button
            size="sm"
            color="failure"
            theme={customTheme.button}
            onClick={onDelete}
            disabled={isSyncing(status.status)}
            title="Delete connection"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
