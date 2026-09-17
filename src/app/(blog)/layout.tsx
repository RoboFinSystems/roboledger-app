import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'

// The blog wears the marketing site's header and footer. Without them a post linked to
// nothing but other posts: a reader arriving from search could not reach the product, and
// the posts passed no links to the homepage or the sibling sites (the footer carries the
// Applications cross-links). The header is fixed, so the offset keeps the page top clear.
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-20">{children}</div>
      <Footer />
    </div>
  )
}
