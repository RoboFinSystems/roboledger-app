'use client'

import { Button, TextInput, Tooltip } from 'flowbite-react'
import React, { useState } from 'react'
import {
  HiCheckCircle,
  HiClipboardCopy,
  HiDownload,
  HiEye,
  HiEyeOff,
} from 'react-icons/hi'
import { customTheme } from '../../theme'

export interface SecureApiKeyFieldProps {
  apiKey: string
  keyId: string
  keyName?: string
  className?: string
  showLabel?: boolean
  label?: string
  onCopy?: () => void
  onReveal?: () => void
  onDownload?: () => void
}

export const SecureApiKeyField: React.FC<SecureApiKeyFieldProps> = ({
  apiKey,
  keyId,
  keyName = 'API Key',
  className = '',
  showLabel = false,
  label = 'API Key',
  onCopy,
  onReveal,
  onDownload,
}) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [revealCount, setRevealCount] = useState(0)

  const maskedKey = `${keyId.substring(0, 8)}${'•'.repeat(24)}`

  const handleReveal = () => {
    if (revealCount >= 3) {
      // Log excessive reveal attempts for security monitoring
      console.warn(`Excessive API key reveals for key ${keyId}`)
    }

    setIsRevealed(!isRevealed)
    setRevealCount((prev) => prev + 1)

    // Auto-hide after 5 seconds for security
    if (!isRevealed) {
      setTimeout(() => {
        setIsRevealed(false)
      }, 5000)
    }

    onReveal?.()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopyStatus('copied')

      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)

      onCopy?.()
    } catch (error) {
      console.error('Failed to copy API key:', error)
    }
  }

  const handleDownload = () => {
    const content = `API Key: ${keyName}
Key ID: ${keyId}
Key Value: ${apiKey}

IMPORTANT: Keep this file secure and do not share it with anyone.
Delete this file after storing the key in a secure location.
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-key-${keyId.substring(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    onDownload?.()
  }

  return (
    <div className={className}>
      {showLabel && (
        <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <div className="relative w-full overflow-hidden">
          <TextInput
            value={isRevealed ? apiKey : maskedKey}
            readOnly
            className="pr-28 font-mono text-sm"
            theme={customTheme.textInput}
            style={{
              minWidth: '100%',
              overflow: isRevealed ? 'auto' : 'hidden',
              whiteSpace: 'nowrap',
            }}
          />
        </div>
        <div className="absolute right-1 flex gap-1">
          <Tooltip content={isRevealed ? 'Hide' : 'Reveal'}>
            <Button
              size="xs"
              color="gray"
              onClick={handleReveal}
              className="h-7 w-7 p-0"
              theme={customTheme.button}
            >
              {isRevealed ? (
                <HiEyeOff className="h-4 w-4" />
              ) : (
                <HiEye className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>

          <Tooltip content={copyStatus === 'copied' ? 'Copied!' : 'Copy'}>
            <Button
              size="xs"
              color={copyStatus === 'copied' ? 'success' : 'gray'}
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              theme={customTheme.button}
            >
              {copyStatus === 'copied' ? (
                <HiCheckCircle className="h-4 w-4" />
              ) : (
                <HiClipboardCopy className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>

          <Tooltip content="Download">
            <Button
              size="xs"
              color="gray"
              onClick={handleDownload}
              className="h-7 w-7 p-0"
              theme={customTheme.button}
            >
              <HiDownload className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
      {isRevealed && (
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
          Key will be hidden automatically in 5 seconds
        </p>
      )}
    </div>
  )
}
