'use client'

import { CURRENT_APP, SignUpForm } from '@/lib/core'
import { useRouter } from 'next/navigation'

export default function RegisterContent() {
  const router = useRouter()

  return (
    <SignUpForm
      apiUrl={
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'
      }
      currentApp={CURRENT_APP}
      showConfirmPassword={true}
      showTermsAcceptance={true}
      redirectTo="/login"
      onSuccess={() => {}}
      onRedirect={(url) => {
        // For better integration with Next.js navigation
        if (url === '/login') {
          router.push('/login')
        } else {
          window.location.href = url || '/login'
        }
      }}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
    />
  )
}
