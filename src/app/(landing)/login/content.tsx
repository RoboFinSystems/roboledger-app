'use client'

import { LoginRedirector } from '@robosystems/core'

/**
 * Interactive auth is centralized on the login home; this page forwards there
 * and consumes the `?session_id=` bridge handoff on the way back.
 *
 * Not a flag any more — the login home owns the WebAuthn Relying Party ID, so
 * a passkey login can only ever complete on that domain. Rendering a local
 * sign-in form here could not finish an `mfa_required` step.
 */
export default function LoginContent() {
  const apiUrl =
    process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

  return <LoginRedirector apiUrl={apiUrl} />
}
