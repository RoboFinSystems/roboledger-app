import Image from 'next/image'
import type { ReactNode } from 'react'

interface ProductShotProps {
  /**
   * Real screenshot path under /public (e.g. "/screenshots/inbox.png"). When
   * omitted, the framed `children` render as an on-brand preview so the page is
   * presentable before real captures land. Swap a screenshot in by passing
   * `src` — nothing else changes.
   */
  src?: string
  alt: string
  /** Short caption rendered under the frame (e.g. the route being shown). */
  caption?: string
  /** Tailwind aspect-ratio utility for the frame body. */
  aspect?: string
  className?: string
  /** In-frame preview shown when no `src` is provided. */
  children?: ReactNode
}

/**
 * A browser-chrome style frame for product screenshots. Renders a real image
 * when `src` is set; otherwise frames `children` as a placeholder preview.
 * Wrapping keeps the hero + spotlights visually complete while authenticated
 * screenshots are being captured.
 */
export default function ProductShot({
  src,
  alt,
  caption,
  aspect = 'aspect-[16/10]',
  className = '',
  children,
}: ProductShotProps) {
  return (
    <figure className={`group relative ${className}`}>
      <div className="from-primary-500/20 to-accent-500/20 absolute -inset-1 rounded-2xl bg-linear-to-br opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-70"></div>
      <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-zinc-950 shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-gray-800 bg-zinc-900/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70"></span>
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70"></span>
          {caption && (
            <span className="ml-3 truncate text-xs text-gray-500">
              {caption}
            </span>
          )}
        </div>
        {src ? (
          <div className={`relative w-full ${aspect}`}>
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover object-top"
            />
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </figure>
  )
}
