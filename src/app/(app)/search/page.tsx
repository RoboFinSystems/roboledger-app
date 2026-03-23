import type { Metadata } from 'next'
import { SearchPageContent } from './content'

export const metadata: Metadata = {
  title: 'Document Search | RoboLedger',
  description: 'Search accounting documents and policies',
}

export default function SearchPage() {
  return <SearchPageContent />
}
