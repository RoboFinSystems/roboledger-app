'use client'

import { SignUpForm } from '@/lib/core'

export default function RegisterContent() {
  return (
    <SignUpForm
      apiUrl={
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'
      }
      currentApp="roboledger"
      showConfirmPassword={true}
      showTermsAcceptance={true}
      redirectTo="/login"
      onSuccess={() => {}}
      onRedirect={(url) => {
        window.location.href = url || '/login'
      }}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  )
}
