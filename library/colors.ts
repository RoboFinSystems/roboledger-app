type BadgeColor = 'success' | 'failure' | 'warning' | 'info' | 'purple' | 'indigo' | 'pink' | 'gray'

export function classificationColor(cls: string): BadgeColor {
  switch (cls) {
    case 'asset':
      return 'success'
    case 'liability':
      return 'failure'
    case 'equity':
      return 'purple'
    case 'inflow':
      return 'info'
    case 'outflow':
      return 'warning'
    case 'cashflow':
      return 'indigo'
    default:
      return 'gray'
  }
}

export function arcTypeColor(assocType: string): BadgeColor {
  switch (assocType) {
    case 'equivalence':
      return 'info'
    case 'general-special':
      return 'purple'
    case 'essence-alias':
      return 'indigo'
    default:
      return 'gray'
  }
}

export function classificationLabel(cls: string): string {
  return cls
}
