'use client'

import { CIK_LENGTH } from '@/lib/constants'
import { customTheme, SDK, useGraphContext } from '@/lib/core'
import { Alert, Button, Label, TextInput } from 'flowbite-react'
import { useCallback, useState } from 'react'

interface SecSetupFormProps {
  onSuccess: (connectionId: string) => void
  onCancel: () => void
}

export default function SecSetupForm({
  onSuccess,
  onCancel,
}: SecSetupFormProps) {
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [cik, setCik] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanCik = useCallback(
    (value: string) => value.trim().padStart(CIK_LENGTH, '0'),
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const padded = cleanCik(cik)
      if (!new RegExp(`^\\d{${CIK_LENGTH}}$`).test(padded)) {
        throw new Error(
          `CIK must be a valid number (up to ${CIK_LENGTH} digits)`
        )
      }

      if (!currentGraphId) {
        setError('No graph selected')
        return
      }

      const response = await SDK.createConnection({
        path: { graph_id: currentGraphId },
        body: {
          provider: 'sec',
          entity_id: '', // Not required for SEC — entity created by pipeline
          sec_config: {
            cik: padded,
          },
        } as any,
      })

      const connectionId = (response.data as any)?.connection_id
      if (!connectionId) {
        throw new Error('Failed to create SEC connection')
      }

      onSuccess(connectionId)
    } catch (err: any) {
      console.error('SEC connection error:', err)
      setError(err.message || 'Failed to set up SEC connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Connect SEC EDGAR
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter a company&apos;s CIK to import SEC filings and XBRL financial
          data into your graph.
        </p>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cik" className="mb-2 block">
            Central Index Key (CIK)
          </Label>
          <TextInput
            id="cik"
            type="text"
            placeholder="e.g., 320193 or 0000320193"
            value={cik}
            onChange={(e) => setCik(e.target.value)}
            required
            theme={customTheme.textInput}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leading zeros are added automatically. Example: Apple Inc. is
            320193.
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <h4 className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
            How to find a CIK
          </h4>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            Search for any company on{' '}
            <a
              href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              SEC EDGAR
            </a>
            . The CIK is displayed in the search results.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            color="gray"
            theme={customTheme.button}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            theme={customTheme.button}
            disabled={loading || !cik.trim()}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </form>
    </div>
  )
}
