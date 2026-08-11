'use client'

import { CURRENT_APP, LoginRedirector, SignUpForm } from '@robosystems/core'

export default function RegisterContent() {
  const apiUrl =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

  // Centralized login: registration happens on the login home; this page
  // forwards there (carrying foreign params like ?invite=). Flag is
  // per-app and reversible — off renders the full form exactly as before.
  if (process.env.NEXT_PUBLIC_CENTRALIZED_LOGIN === 'true') {
    return <LoginRedirector mode="register" apiUrl={apiUrl} />
  }

  return (
    <SignUpForm
      apiUrl={apiUrl}
      currentApp={CURRENT_APP}
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
