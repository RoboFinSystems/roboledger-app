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

export function DocsMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{ a: DocsLink, table: DocsTable }}
    >
      {children}
    </ReactMarkdown>
  )
}
