// Shared renderer for dynamically generated 1200×630 OpenGraph/Twitter images
// (Next file conventions → ImageResponse/Satori). Used for the public marketing pages,
// which otherwise fall back to the square brand logo. Uses the built-in default font.
// Brand gradient from the cross-app brand map (src/lib/core/auth-core/config.ts):
// roboledger = violet → purple → fuchsia.

import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const GRADIENT = 'linear-gradient(135deg, #8B5CF6, #A855F7 55%, #D946EF)'
const ACCENT = '#A855F7'
const DOMAIN = 'roboledger.ai'

export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  const titleSize = title.length > 70 ? 54 : title.length > 40 ? 66 : 78
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '14px',
          backgroundImage: GRADIENT,
        }}
      />
      <div
        style={{
          display: 'flex',
          fontSize: 32,
          fontWeight: 600,
          color: ACCENT,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: '#9CA3AF',
              marginTop: 28,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', fontSize: 28, color: '#6B7280' }}>
        {DOMAIN}
      </div>
    </div>,
    OG_SIZE
  )
}
