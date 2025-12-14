import * as SDK from '@robosystems/client'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingStatus } from '../useBillingStatus'

// Mock the org context
vi.mock('../../contexts/org-context', () => ({
  useOrg: vi.fn(),
}))

// Import after mocks
import { useOrg } from '../../contexts/org-context'

const mockUseOrg = vi.mocked(useOrg)

// Mock the SDK
vi.mock('@robosystems/client', () => ({
  getOrgBillingCustomer: vi.fn(),
}))

const mockGetOrgBillingCustomer = vi.mocked(SDK.getOrgBillingCustomer)

describe('useBillingStatus', () => {
  const mockOrg = {
    id: 'test-org-id',
    name: 'Test Organization',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOrg.mockReturnValue({
      currentOrg: mockOrg,
      orgs: [mockOrg],
      loading: false,
      setCurrentOrg: vi.fn(),
    })
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useBillingStatus())

    expect(result.current.loading).toBe(true)
    expect(result.current.hasPaymentMethod).toBe(false)
    expect(result.current.invoiceBillingEnabled).toBe(false)
    expect(result.current.stripeCustomerId).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('should load billing status successfully', async () => {
    const mockBillingData = {
      has_payment_method: true,
      invoice_billing_enabled: false,
      stripe_customer_id: 'cus_123456789',
    }

    mockGetOrgBillingCustomer.mockResolvedValue({
      data: mockBillingData,
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasPaymentMethod).toBe(true)
    expect(result.current.invoiceBillingEnabled).toBe(false)
    expect(result.current.stripeCustomerId).toBe('cus_123456789')
    expect(result.current.error).toBe(null)
    expect(result.current.requiresPayment).toBe(false)
  })

  it('should handle billing data with missing fields', async () => {
    const mockBillingData = {
      // Missing fields should default to false/null
    }

    mockGetOrgBillingCustomer.mockResolvedValue({
      data: mockBillingData,
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasPaymentMethod).toBe(false)
    expect(result.current.invoiceBillingEnabled).toBe(false)
    expect(result.current.stripeCustomerId).toBe(null)
    expect(result.current.requiresPayment).toBe(true)
  })

  it('should handle API error with object error detail', async () => {
    const mockError = {
      detail: 'Billing service unavailable',
    }

    mockGetOrgBillingCustomer.mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Billing service unavailable')
    expect(result.current.hasPaymentMethod).toBe(false)
    expect(result.current.invoiceBillingEnabled).toBe(false)
  })

  it('should handle API error with string error', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: null,
      error: 'Network error',
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // String errors get converted to default message
    expect(result.current.error).toBe('Failed to get billing status')
  })

  it('should handle API error with unknown format', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: null,
      error: { unexpected: 'format' },
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to get billing status')
  })

  it('should handle network error', async () => {
    mockGetOrgBillingCustomer.mockRejectedValue(new Error('Network timeout'))

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network timeout')
    expect(result.current.hasPaymentMethod).toBe(false)
    expect(result.current.invoiceBillingEnabled).toBe(false)
  })

  it('should handle unknown error type', async () => {
    mockGetOrgBillingCustomer.mockRejectedValue('String error')

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Unknown error')
  })

  it('should not call API when no organization', () => {
    mockUseOrg.mockReturnValue({
      currentOrg: null,
      orgs: [],
      loading: false,
      setCurrentOrg: vi.fn(),
    })

    const { result } = renderHook(() => useBillingStatus())

    expect(result.current.loading).toBe(false)
    expect(mockGetOrgBillingCustomer).not.toHaveBeenCalled()
  })

  it('should calculate requiresPayment correctly', async () => {
    // Test case 1: Has payment method
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: true,
        invoice_billing_enabled: false,
      },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.requiresPayment).toBe(false)
  })

  it('should calculate requiresPayment as false when invoice billing is enabled', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: false,
        invoice_billing_enabled: true,
      },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.requiresPayment).toBe(false)
  })

  it('should calculate requiresPayment as true when neither payment method nor invoice billing', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: false,
        invoice_billing_enabled: false,
      },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.requiresPayment).toBe(true)
  })

  it('should provide refresh function', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: true,
        invoice_billing_enabled: false,
        stripe_customer_id: 'cus_123',
      },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call refresh with different data
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: false,
        invoice_billing_enabled: true,
        stripe_customer_id: 'cus_456',
      },
      error: null,
    })

    await result.current.refresh()

    expect(mockGetOrgBillingCustomer).toHaveBeenCalledWith({
      path: { org_id: mockOrg.id },
    })

    await waitFor(() => {
      expect(result.current.hasPaymentMethod).toBe(false)
      expect(result.current.invoiceBillingEnabled).toBe(true)
      expect(result.current.stripeCustomerId).toBe('cus_456')
    })
  })

  it('should call API with correct organization ID', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: {
        has_payment_method: true,
      },
      error: null,
    })

    renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(mockGetOrgBillingCustomer).toHaveBeenCalledWith({
        path: { org_id: mockOrg.id },
      })
    })
  })

  it('should handle organization change', async () => {
    const newOrg = {
      id: 'new-org-id',
      name: 'New Organization',
    }

    mockGetOrgBillingCustomer.mockResolvedValue({
      data: { has_payment_method: true },
      error: null,
    })

    const { rerender } = renderHook(() => useBillingStatus())

    // Change organization
    mockUseOrg.mockReturnValue({
      currentOrg: newOrg,
      orgs: [newOrg],
      loading: false,
      setCurrentOrg: vi.fn(),
    })

    rerender()

    // Should call API again with new org ID
    await waitFor(() => {
      expect(mockGetOrgBillingCustomer).toHaveBeenCalledWith({
        path: { org_id: newOrg.id },
      })
    })
  })

  it('should handle loading state during refresh', async () => {
    mockGetOrgBillingCustomer.mockResolvedValue({
      data: { has_payment_method: true },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Start refresh - the loading state should eventually return to false
    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify the API was called
    expect(mockGetOrgBillingCustomer).toHaveBeenCalledWith({
      path: { org_id: mockOrg.id },
    })
  })

  it('should clear error on successful refresh', async () => {
    // Initial call fails
    mockGetOrgBillingCustomer.mockRejectedValueOnce(new Error('Initial error'))

    // Second call (refresh) succeeds
    mockGetOrgBillingCustomer.mockResolvedValueOnce({
      data: { has_payment_method: true },
      error: null,
    })

    const { result } = renderHook(() => useBillingStatus())

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBe('Initial error')
    })

    // Refresh should clear error
    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.error).toBe(null)
    })
  })
})
