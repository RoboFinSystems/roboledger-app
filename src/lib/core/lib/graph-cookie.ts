const GRAPH_COOKIE_NAME = 'selected-graph'

export interface GraphCookie {
  graphId: string
}

// Server-side cookie utilities for Next.js 15
export const graphCookie = {
  async get(): Promise<GraphCookie | null> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookie = cookieStore.get(GRAPH_COOKIE_NAME)

    if (!cookie?.value) {
      return null
    }

    try {
      return JSON.parse(decodeURIComponent(cookie.value))
    } catch {
      return null
    }
  },

  async set(value: GraphCookie): Promise<void> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieValue = JSON.stringify(value)

    cookieStore.set(GRAPH_COOKIE_NAME, encodeURIComponent(cookieValue), {
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
    cookieStore.delete(GRAPH_COOKIE_NAME)
  },
}

// Client-side utilities (if needed)
export const clientGraphCookie = {
  get(): GraphCookie | null {
    if (typeof document === 'undefined') {
      return null
    }

    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${GRAPH_COOKIE_NAME}=`))

    if (!cookie) {
      return null
    }

    const cookieValue = cookie.split('=')[1]
    if (!cookieValue) {
      return null
    }

    try {
      return JSON.parse(decodeURIComponent(cookieValue))
    } catch {
      return null
    }
  },
}
