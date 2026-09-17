import renderPostCard from '../opengraph-image'

// The post's 1200×630 card at a stable URL, for the BlogPosting JSON-LD `image`. Next
// serves the opengraph-image convention under a build-generated suffix
// (`opengraph-image-1r5u6l`), which structured data cannot name reliably. Same renderer,
// so the card a search engine sees is the one a shared link shows.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return renderPostCard({ params })
}
