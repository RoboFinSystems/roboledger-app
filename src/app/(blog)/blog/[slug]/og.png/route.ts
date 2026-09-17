import renderPostCard from '../opengraph-image'

// The post's 1200×630 card at a stable URL, for the BlogPosting JSON-LD `image`. Next
// serves the opengraph-image convention under a build-generated suffix
// (`opengraph-image-1r5u6l`), which structured data cannot name reliably. Same renderer,
// so the card a search engine sees is the one a shared link shows.
//
// ImageResponse answers `max-age=0, must-revalidate` in production, so without a header of
// its own every fetch re-rendered the card on the app instance. A card changes only when a
// post's title or excerpt does, so a day at the CDN is fresh enough.
const CARD_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const card = await renderPostCard({ params })
  card.headers.set('Cache-Control', CARD_CACHE_CONTROL)
  return card
}
