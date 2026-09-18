import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DocsImage } from '../DocsMarkdown'

const CDN = 'https://assets.robosystems.ai/docs/product/roboledger/images'

describe('DocsImage', () => {
  it('frames a picture and opens it full size in a new tab', () => {
    render(<DocsImage src={`${CDN}/plan.png`} alt="The Plan page" />)
    const img = screen.getByRole('img', { name: 'The Plan page' })
    const link = img.closest('a')

    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.className).toContain('border')
    expect(link?.getAttribute('href')).toBe(`${CDN}/plan.png`)
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('plays a clip as a muted video with controls', () => {
    const { container } = render(
      <DocsImage src={`${CDN}/clips/close.mp4`} alt="Closing August" />
    )
    const video = container.querySelector('video')

    expect(video?.getAttribute('src')).toBe(`${CDN}/clips/close.mp4`)
    expect(video?.getAttribute('aria-label')).toBe('Closing August')
    expect(video?.hasAttribute('controls')).toBe(true)
    expect(video?.muted).toBe(true)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?t=12&v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
  ])('embeds a YouTube link from its id: %s', (src) => {
    render(<DocsImage src={src} alt="A tour of RoboLedger" />)
    const frame = screen.getByTitle('A tour of RoboLedger')

    expect(frame.tagName).toBe('IFRAME')
    expect(frame.getAttribute('src')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('treats a lookalike host as a picture, not an embed', () => {
    const { container } = render(
      <DocsImage src="https://www.youtube.com.example.test/watch?v=dQw4w9WgXcQ" />
    )

    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('renders nothing without a source', () => {
    const { container } = render(<DocsImage alt="Missing" />)

    expect(container.innerHTML).toBe('')
  })
})
