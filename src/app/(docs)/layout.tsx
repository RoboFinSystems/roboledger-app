import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'

// The docs wear the marketing site's header and footer, like the blog: a reader arriving
// from search on a docs page can still reach the product and the sibling sites. The
// fixed header is about 88px tall unscrolled, so the offset keeps the page top clear.
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-28">{children}</div>
      <Footer />
    </div>
  )
}
