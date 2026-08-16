'use client'

import { LoginRedirector } from '@robosystems/core'

/**
 * Registration happens on the login home; this page forwards there, carrying
 * foreign params like `?invite=` so mailed links keep working. See the login
 * page for why this is no longer flagged.
 */
export default function RegisterContent() {
  const apiUrl =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

  return <LoginRedirector mode="register" apiUrl={apiUrl} />
}
