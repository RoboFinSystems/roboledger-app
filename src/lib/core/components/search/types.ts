export interface SearchFilterConfig {
  sourceType?: boolean
  entity?: boolean
  formType?: boolean
  fiscalYear?: boolean
}

export interface SearchConfig {
  title: string
  description: string
  placeholder: string
  showFilters?: boolean
  defaultSourceType?: string
  filters?: SearchFilterConfig
}
