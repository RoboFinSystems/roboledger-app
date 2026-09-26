'use client'

import { useEffect, useRef } from 'react'

interface LiveDemoProps {
  /** Demo module name under /public/demos (e.g. "hero", "inbox"). */
  name: string
  /** Stage aspect ratio as width / height, reserved before the demo loads. */
  aspect: number
  /** What the animation shows, for screen readers. */
  label: string
  className?: string
}

interface DemoHandle {
  destroy(): void
}

/**
 * An animated product demo from /public/demos, mounted in a shadow root so its
 * styles stay off the page. The demos are plain ES modules shared with the
 * content machine's renderer, which shoots the same files for the social cuts;
 * see public/demos/kit.js. They loop only while on screen and hold one frame
 * for reduced motion.
 */
export default function LiveDemo({
  name,
  aspect,
  label,
  className = '',
}: LiveDemoProps) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let handle: DemoHandle | undefined
    let cancelled = false
    const load = async () => {
      // Served from /public at runtime, never bundled.
      const base = '/demos/'
      const [kit, demo] = await Promise.all([
        import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ base + 'kit.js'
        ),
        import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ base +
            name +
            '.js'
        ),
      ])
      if (cancelled || !host.current) return
      handle = kit.mount(host.current, demo.default)
    }
    load().catch(() => {
      // A demo that fails to load leaves the reserved frame empty; the page stands without it.
    })
    return () => {
      cancelled = true
      handle?.destroy()
    }
  }, [name])

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: aspect }}
    />
  )
}
