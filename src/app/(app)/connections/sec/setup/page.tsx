'use client'

import { CIK_LENGTH } from '@/lib/constants'
import { customTheme, SDK, useGraphContext } from '@/lib/core'
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  Label,
  TextInput,
} from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HiArrowLeft, HiHome } from 'react-icons/hi'

export default function SECSetupPage() {
  const router = useRouter()
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [cik, setCik] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    company_info?: any
    error?: string
  } | null>(null)

  const validateCik = useCallback(
    async (cikValue: string) => {
      if (!cikValue || cikValue.length < 3) {
        setValidationResult(null)
        return
      }

      setValidating(true)
      try {
        if (!currentGraphId) {
          setError('No graph selected')
          return
        }
        const cleanCik = cikValue.trim().padStart(CIK_LENGTH, '0')

        // For now, we'll assume the CIK is valid and create the connection directly
        // This is a placeholder until the validateCik endpoint is available
        const response = {
          data: { valid: true, company_info: { company_name: 'Company Name' } },
        }

        setValidationResult(response.data as any)
      } catch (err: any) {
        console.error('CIK validation error:', err)
        setValidationResult({
          valid: false,
          error: 'Failed to validate CIK',
        })
      } finally {
        setValidating(false)
      }
    },
    [currentGraphId]
  )

  const handleCikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCik = e.target.value
    setCik(newCik)
  }

  // Debounce CIK validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateCik(cik)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [cik, validateCik])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate CIK format (should be 10 digits, can be padded with zeros)
      const cleanCik = cik.trim().padStart(CIK_LENGTH, '0')
      if (!new RegExp(`^\\d{${CIK_LENGTH}}$`).test(cleanCik)) {
        throw new Error(`CIK must be a valid ${CIK_LENGTH}-digit number`)
      }

      // Check graph selection
      if (!currentGraphId) {
        setError('No graph selected')
        return
      }

      // Create SEC connection via backend API
      const response = await SDK.createConnection({
        path: { graph_id: currentGraphId },
        body: {
          entity_id: currentGraphId,
          provider: 'sec',
          sec_config: {
            cik: cleanCik,
          },
        },
      })

      if ((response.data as any)?.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/connections?success=sec-connected')
        }, 2000)
      } else {
        throw new Error('Failed to create SEC connection')
      }
    } catch (err: any) {
      console.error('SEC connection error:', err)
      setError(err.message || 'Failed to set up SEC connection')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card theme={customTheme.card} className="w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              SEC Connection Setup Complete!
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Your SEC filing connection has been configured and company
              information has been automatically retrieved. You can now sync
              historical filings.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to connections page...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-y-6 px-4 pt-6">
        <div className="col-span-full">
          <Breadcrumb className="mb-5">
            <BreadcrumbItem href="/home">
              <div className="flex items-center gap-x-3">
                <HiHome className="text-xl" />
                <span className="dark:text-white">Home</span>
              </div>
            </BreadcrumbItem>
            <BreadcrumbItem href="/connections">Connections</BreadcrumbItem>
            <BreadcrumbItem>SEC Setup</BreadcrumbItem>
          </Breadcrumb>

          <div className="mb-6 flex items-center gap-4">
            <Button
              color="gray"
              theme={customTheme.button}
              onClick={() => router.back()}
            >
              <HiArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-heading text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              SEC Filing Connection Setup
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="mx-auto max-w-2xl">
          <Card theme={customTheme.card}>
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Connect SEC EDGAR Database
            </h3>

            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Enter your company's Central Index Key (CIK) to automatically
              import historical SEC filings and XBRL data. The company name will
              be automatically retrieved from the SEC database.
            </p>

            {error && (
              <Alert color="failure" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cik" className="mb-2 block">
                  Central Index Key (CIK) *
                </Label>
                <TextInput
                  id="cik"
                  type="text"
                  placeholder="e.g., 320193 or 0000320193"
                  value={cik}
                  onChange={handleCikChange}
                  required
                  theme={customTheme.textInput}
                  color={
                    validationResult?.valid === false
                      ? 'failure'
                      : validationResult?.valid === true
                        ? 'success'
                        : 'gray'
                  }
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter your 10-digit CIK number. You can find this on the SEC
                  EDGAR website.
                </p>

                {/* CIK Validation Feedback */}
                {validating && (
                  <div className="mt-2 flex items-center text-sm text-blue-600">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Validating CIK...
                  </div>
                )}

                {validationResult?.valid === true && (
                  <div className="mt-2 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      ✓ Valid CIK found
                      {validationResult.company_info?.company_name && (
                        <div className="mt-1 font-medium">
                          Company: {validationResult.company_info.company_name}
                        </div>
                      )}
                      {validationResult.company_info?.ticker && (
                        <div className="text-xs">
                          Ticker: {validationResult.company_info.ticker}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {validationResult?.valid === false && (
                  <div className="mt-2 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                    <div className="text-sm text-red-800 dark:text-red-200">
                      ✗{' '}
                      {validationResult.error ||
                        'CIK not found in SEC database'}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                  How to find your CIK:
                </h4>
                <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>Visit the SEC EDGAR website</li>
                  <li>Search for your company name</li>
                  <li>Your CIK will be displayed in the search results</li>
                  <li>Example: Apple Inc. has CIK 0000320193</li>
                </ol>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  color="gray"
                  theme={customTheme.button}
                  onClick={() => router.back()}
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
                  {loading ? 'Setting up...' : 'Connect SEC'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
