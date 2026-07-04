'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders a natural-language console answer as GitHub-flavored markdown, themed
 * for the dark terminal. The backend now returns enriched markdown (### headings,
 * **bold**, and | pipe tables); without this it rendered as raw literal text.
 *
 * Styling stays inside the terminal's cyan/mono aesthetic — the surrounding
 * container supplies `font-mono text-sm`, so tables and code inherit it.
 */
export function ConsoleMarkdown({ content }: { content: string }) {
  return (
    <div className="leading-relaxed text-cyan-400">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-4 mb-2 text-base font-bold text-cyan-300 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 mb-2 text-sm font-bold text-cyan-300 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-1.5 text-sm font-semibold text-cyan-300 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-cyan-300 uppercase first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="my-2 first:mt-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-cyan-200 italic">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 underline hover:text-cyan-200"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-cyan-700 pl-3 text-cyan-300/80 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-gray-800" />,
          code: ({ className, children, ...props }: any) =>
            /language-/.test(className || '') ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code
                className="rounded bg-gray-800 px-1 py-0.5 text-cyan-200"
                {...props}
              >
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded border border-gray-800 bg-gray-900/40 p-3 text-xs text-cyan-300">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded border border-gray-800">
              <table className="w-full border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-gray-800 bg-gray-900">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-cyan-400">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-gray-900 px-3 py-2 text-gray-300">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
