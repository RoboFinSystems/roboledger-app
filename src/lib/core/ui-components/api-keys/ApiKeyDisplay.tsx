'use client'

import { Label } from 'flowbite-react'
import React from 'react'
import { SecureApiKeyField } from './SecureApiKeyField'

export interface ApiKeyDisplayProps {
  label: string
  value: string
  keyId?: string
  colorScheme?: 'blue' | 'green'
  theme?: any
  className?: string
  onCopy?: () => void
  onReveal?: () => void
  onDownload?: () => void
}

export const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({
  label,
  value,
  keyId = 'api-key',
  theme,
  className = '',
  onCopy,
  onReveal,
  onDownload,
}) => {
  return (
    <div className={className}>
      <Label
        theme={theme?.label}
        htmlFor={`display-${label}`}
        className="text-base font-bold"
      >
        {label}
      </Label>
      <div className="mt-2">
        <SecureApiKeyField
          apiKey={value}
          keyId={keyId}
          keyName={label}
          onCopy={onCopy}
          onReveal={onReveal}
          onDownload={onDownload}
        />
      </div>
    </div>
  )
}
