'use client'

import { CURRENT_APP, LoginRedirector, SignInForm } from '@robosystems/core'

export default function LoginContent() {
  const apiUrl =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

  // Centralized login: this page becomes a redirector to the login home
  // (still consuming ?session_id= bridge handoffs locally). Flag is
  // per-app and reversible — off renders the full form exactly as before.
  if (process.env.NEXT_PUBLIC_CENTRALIZED_LOGIN === 'true') {
    return <LoginRedirector apiUrl={apiUrl} />
  }

  return (
    <SignInForm
      apiUrl={apiUrl}
      enableSSO={true}
      currentApp={CURRENT_APP}
      redirectTo="/home"
      onSuccess={() => {}}
      onRedirect={(url) => {
        window.location.href = url || '/home'
      }}
    />
  )
}
