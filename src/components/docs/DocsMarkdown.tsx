import Link from 'next/link'
import type { ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

// GitHub-flavored markdown, rendered on the server. The bodies are never compiled as
// MDX and raw HTML is not interpreted, so the literal `{` and `<` throughout the wiki's
// prose stay text. rehype-slug gives headings GitHub's ids, which the wiki's anchor
// links and tableOfContents() both rely on.

function DocsLink({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/')) {
    return <Link href={href}>{children}</Link>
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  )
}

function DocsTable(props: ComponentProps<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  )
}

// Markdown image syntax is the one way a page shows media, so the file decides what
// it renders as: a clip plays, a YouTube link embeds, anything else is a picture.
// Screenshots of the app are dark on a dark page, so each one gets a frame, and it
// opens full size because the column shows it at about half. Everything here is
// phrasing content, because markdown puts an image inside a paragraph.
const VIDEO_FILE = /\.(mp4|webm)(?:[?#]|$)/i
const YOUTUBE =
  /^https:\/\/(?:www\.youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{11})/

const FRAME = 'my-8 block w-full rounded-lg border border-gray-700'

export function DocsImage({ src, alt = '', title }: ComponentProps<'img'>) {
  if (typeof src !== 'string' || !src) return null
  const youtube = YOUTUBE.exec(src)
  if (youtube) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtube[1]}`}
        title={alt || title || 'Video'}
        allow="encrypted-media; picture-in-picture; fullscreen"
        loading="lazy"
        className={`${FRAME} aspect-video`}
      />
    )
  }
  if (VIDEO_FILE.test(src)) {
    return (
      <video
        src={src}
        title={title}
        aria-label={alt}
        controls
        muted
        playsInline
        preload="metadata"
        className={FRAME}
      >
        <a href={src}>{alt || 'Download the video'}</a>
      </video>
    )
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      title="Open full size"
      className="not-prose block cursor-zoom-in"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- CDN files of any size; markdown carries no dimensions for next/image */}
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        decoding="async"
        className={`${FRAME} h-auto`}
      />
    </a>
  )
}

export function DocsMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{ a: DocsLink, img: DocsImage, table: DocsTable }}
    >
      {children}
    </ReactMarkdown>
  )
}
