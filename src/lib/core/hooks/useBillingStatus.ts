'use client'

import * as SDK from '@robosystems/client'
import { useCallback, useEffect, useState } from 'react'
import { useOrg } from '../contexts/org-context'

export interface BillingStatus {
  hasPaymentMethod: boolean
  invoiceBillingEnabled: boolean
  stripeCustomerId: string | null
  loading: boolean
  error: string | null
}

export function useBillingStatus() {
  const { currentOrg } = useOrg()
  const [status, setStatus] = useState<BillingStatus>({
    hasPaymentMethod: false,
    invoiceBillingEnabled: false,
    stripeCustomerId: null,
    loading: true,
    error: null,
  })

  const checkBillingStatus = useCallback(async () => {
    if (!currentOrg?.id) {
      setStatus((prev) => ({ ...prev, loading: false }))
      return
    }

    try {
      setStatus((prev) => ({ ...prev, loading: true, error: null }))

      const response = await SDK.getOrgBillingCustomer({
        path: { org_id: currentOrg.id },
      })

      if (response.error) {
        const errorMsg =
          typeof response.error === 'object' && 'detail' in response.error
            ? String(response.error.detail)
            : 'Failed to get billing status'
        throw new Error(errorMsg)
      }

      if (response.data) {
        setStatus({
          hasPaymentMethod: response.data.has_payment_method || false,
          invoiceBillingEnabled: response.data.invoice_billing_enabled || false,
          stripeCustomerId: response.data.stripe_customer_id || null,
          loading: false,
          error: null,
        })
      }
    } catch (error) {
      console.error('Failed to check billing status:', error)
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [currentOrg])

  useEffect(() => {
    checkBillingStatus()
  }, [checkBillingStatus])

  return {
    ...status,
    refresh: checkBillingStatus,
    requiresPayment: !status.hasPaymentMethod && !status.invoiceBillingEnabled,
  }
}
