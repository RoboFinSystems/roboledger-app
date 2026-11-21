import type { ReactNode } from 'react'

// The building blocks every product page shares, so the pages differ only in their copy.

// `wrap` breaks a lone URL across lines on a phone rather than hiding its end.
export function Code({ children, wrap }: { children: string; wrap?: boolean }) {
  return (
    <pre
      className={`rounded-lg border border-gray-800 bg-zinc-950 px-4 py-3 text-sm text-gray-200 ${wrap ? 'break-all whitespace-pre-wrap' : 'overflow-x-auto'}`}
    >
      <code>{children}</code>
    </pre>
  )
}

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-gray-900 py-14">
      <h2 className="font-heading mb-6 text-3xl font-bold text-white">
        {title}
      </h2>
      <div className="space-y-4 text-lg leading-relaxed text-gray-300">
        {children}
      </div>
    </section>
  )
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export function CardGrid({
  items,
}: {
  items: { title: string; body: ReactNode }[]
}) {
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-gray-800 bg-zinc-950/60 p-5"
        >
          <dt className="mb-2 font-semibold text-white">{item.title}</dt>
          <dd className="text-base text-gray-400">{item.body}</dd>
        </div>
      ))}
    </dl>
  )
}

export const LINK_CLASS = 'text-primary-400 hover:text-primary-300'
export const PRIMARY_BUTTON_CLASS =
  'from-primary-500 to-secondary-500 shadow-primary-500/25 hover:shadow-primary-500/40 rounded-lg bg-linear-to-r px-6 py-3 text-center font-medium text-white shadow-lg transition-all'
export const OUTLINE_BUTTON_CLASS =
  'rounded-lg border border-gray-600 px-6 py-3 text-center font-medium text-white transition-all hover:border-gray-500 hover:bg-white/5'
