const ENTITY_COOKIE_NAME = 'selected-entity'

export interface EntityCookie {
  identifier: string
  name: string
  graphId: string
}

// Server-side cookie utilities for Next.js 15
export const entityCookie = {
  async get(): Promise<EntityCookie | null> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookie = cookieStore.get(ENTITY_COOKIE_NAME)

    if (!cookie?.value) {
      return null
    }

    try {
      return JSON.parse(decodeURIComponent(cookie.value))
    } catch {
      return null
    }
  },

  async set(value: EntityCookie): Promise<void> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieValue = JSON.stringify(value)

    cookieStore.set(ENTITY_COOKIE_NAME, encodeURIComponent(cookieValue), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  },

  async delete(): Promise<void> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete(ENTITY_COOKIE_NAME)
  },
}
