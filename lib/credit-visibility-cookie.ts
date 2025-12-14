const CREDIT_VISIBILITY_COOKIE_NAME = 'credit-visibility'

export interface CreditVisibilityCookie {
  showCredits: boolean
}

export const creditVisibilityCookie = {
  async get(): Promise<CreditVisibilityCookie> {
    try {
      // Dynamic import to avoid client-side build errors
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const cookie = cookieStore.get(CREDIT_VISIBILITY_COOKIE_NAME)

      if (!cookie) {
        return { showCredits: true } // Default to showing credits
      }

      try {
        return JSON.parse(cookie.value)
      } catch {
        return { showCredits: true }
      }
    } catch (error) {
      // If we're on the client side or cookies are not available
      console.warn('Unable to access cookies:', error)
      return { showCredits: true }
    }
  },

  async set(value: CreditVisibilityCookie): Promise<void> {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.set(CREDIT_VISIBILITY_COOKIE_NAME, JSON.stringify(value), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    } catch (error) {
      console.error('Unable to set cookie:', error)
    }
  },

  // Client-side helper to parse the cookie
  parse(cookieString: string | undefined): CreditVisibilityCookie {
    if (!cookieString) {
      return { showCredits: true }
    }

    const cookies = cookieString.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )

    const creditVisibility = cookies[CREDIT_VISIBILITY_COOKIE_NAME]
    if (!creditVisibility) {
      return { showCredits: true }
    }

    try {
      return JSON.parse(decodeURIComponent(creditVisibility))
    } catch {
      return { showCredits: true }
    }
  },
}
