'use client'

import { SignInForm } from '@/lib/core'

export default function LoginContent() {
  return (
    <SignInForm
      apiUrl={
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'
      }
      enableSSO={true}
      currentApp="roboledger"
      redirectTo="/home"
      onSuccess={() => {}}
      onRedirect={(url) => {
        window.location.href = url || '/home'
      }}
    />
  )
}
