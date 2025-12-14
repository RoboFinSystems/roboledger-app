'use client'

import * as SDK from '@robosystems/client'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export interface OrgContextState {
  currentOrg: SDK.OrgResponse | null
  orgs: SDK.OrgResponse[]
  loading: boolean
  error: string | null
}

export interface OrgContextValue extends OrgContextState {
  refreshOrgs: () => Promise<void>
  setCurrentOrg: (org: SDK.OrgResponse) => void
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

export interface OrgProviderProps {
  children: React.ReactNode
}

/**
 * Organization context provider
 * Manages the current organization and provides org-related state
 */
export function OrgProvider({ children }: OrgProviderProps) {
  const [state, setState] = useState<OrgContextState>({
    currentOrg: null,
    orgs: [],
    loading: true,
    error: null,
  })

  const refreshOrgs = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await SDK.listUserOrgs()

      if (response.error) {
        const errorMsg =
          typeof response.error === 'object' && 'detail' in response.error
            ? String(response.error.detail)
            : 'Failed to load organizations'
        throw new Error(errorMsg)
      }

      if (response.data) {
        const orgs = response.data.orgs || []

        // Since users can only be in one org, set it as current
        const currentOrg = orgs.length > 0 ? orgs[0] : null

        setState({
          currentOrg,
          orgs,
          loading: false,
          error: null,
        })
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  const setCurrentOrg = useCallback((org: SDK.OrgResponse) => {
    setState((prev) => ({
      ...prev,
      currentOrg: org,
    }))
  }, [])

  useEffect(() => {
    refreshOrgs()
  }, [refreshOrgs])

  const value: OrgContextValue = {
    ...state,
    refreshOrgs,
    setCurrentOrg,
  }

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

/**
 * Hook to access organization context
 * @throws {Error} If used outside of OrgProvider
 */
export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}
