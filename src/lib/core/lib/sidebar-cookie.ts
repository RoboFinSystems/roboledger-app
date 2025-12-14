const NAME = 'sidebar-collapsed'

export interface SidebarCookie {
  isCollapsed: boolean
}

// Server-side cookie utilities (for Server Components)
export const sidebarCookie = {
  async get(): Promise<SidebarCookie> {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    const cookie = (await cookies()).get(NAME)
    const isCollapsed = cookie?.value === 'true'

    return { isCollapsed }
  },
  async set(value: SidebarCookie) {
    // Only import cookies when actually needed (server-side)
    const { cookies } = await import('next/headers')
    ;(await cookies()).set(NAME, String(value.isCollapsed), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  },
}

// Client-side cookie utilities (for Client Components)
export const clientSidebarCookie = {
  get(): SidebarCookie {
    if (typeof document === 'undefined') {
      return { isCollapsed: false }
    }

    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${NAME}=`))

    const isCollapsed = cookie?.split('=')[1] === 'true'
    return { isCollapsed }
  },

  set(value: SidebarCookie) {
    if (typeof document === 'undefined') return

    // Set cookie with consistent options
    const maxAge = 60 * 60 * 24 * 365 // 1 year in seconds
    const secure = window.location.protocol === 'https:' ? '; secure' : ''
    document.cookie = `${NAME}=${String(value.isCollapsed)}; path=/; max-age=${maxAge}; samesite=lax${secure}`
  },
}
