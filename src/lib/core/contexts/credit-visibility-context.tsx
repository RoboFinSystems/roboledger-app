'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getCreditVisibility,
  setCreditVisibility,
} from '../actions/credit-visibility-actions'

interface CreditVisibilityContextType {
  showCredits: boolean
  toggle: () => void
  setShowCredits: (show: boolean) => void
}

const CreditVisibilityContext =
  createContext<CreditVisibilityContextType | null>(null)

export interface CreditVisibilityProviderProps {
  children: React.ReactNode
  initialShowCredits?: boolean
}

export function CreditVisibilityProvider({
  children,
  initialShowCredits = false,
}: CreditVisibilityProviderProps) {
  const [showCredits, setShowCredits] = useState(initialShowCredits)

  const toggle = async () => {
    const newValue = !showCredits
    setShowCredits(newValue)

    // Persist to server via server action
    try {
      await setCreditVisibility(newValue)
    } catch (error) {
      console.error('Failed to update credit visibility preference:', error)
    }
  }

  const updateShowCredits = async (show: boolean) => {
    setShowCredits(show)

    // Persist to server via server action
    try {
      await setCreditVisibility(show)
    } catch (error) {
      console.error('Failed to update credit visibility preference:', error)
    }
  }

  // Load initial preference from cookie on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const showCreditsValue = await getCreditVisibility()
        setShowCredits(showCreditsValue)
      } catch (error) {
        console.error('Failed to load credit visibility preference:', error)
      }
    }

    loadPreference()
  }, [])

  return (
    <CreditVisibilityContext.Provider
      value={{
        showCredits,
        toggle,
        setShowCredits: updateShowCredits,
      }}
    >
      {children}
    </CreditVisibilityContext.Provider>
  )
}

export function useCreditVisibility() {
  const context = useContext(CreditVisibilityContext)
  if (!context) {
    throw new Error(
      'useCreditVisibility must be used within a CreditVisibilityProvider'
    )
  }
  return context
}
