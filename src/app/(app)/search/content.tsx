'use client'

import { SearchContent, type SearchConfig } from '@/lib/core'

const CONFIG: SearchConfig = {
  title: 'Document Search',
  description: 'Search accounting policies, procedures, and uploaded documents',
  placeholder: 'Search policies, procedures, chart of accounts guides...',
  filters: { sourceType: true },
}

export function SearchPageContent() {
  return <SearchContent config={CONFIG} />
}
