'use client'

import { CURRENT_APP, SignInForm } from '@/lib/core'

export default function LoginContent() {
  return (
    <SignInForm
      apiUrl={
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'
      }
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
