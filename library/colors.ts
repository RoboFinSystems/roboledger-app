type BadgeColor =
  | 'success'
  | 'failure'
  | 'warning'
  | 'info'
  | 'purple'
  | 'indigo'
  | 'pink'
  | 'gray'

export function classificationColor(cls: string): BadgeColor {
  switch (cls) {
    case 'asset':
    case 'contraAsset':
      return 'success'
    case 'liability':
    case 'contraLiability':
      return 'failure'
    case 'equity':
    case 'contraEquity':
    case 'temporaryEquity':
      return 'purple'
    case 'revenue':
    case 'expenseReversal':
    case 'gain':
      return 'info'
    case 'expense':
    case 'loss':
      return 'warning'
    case 'comprehensiveIncome':
    case 'investmentByOwners':
    case 'distributionToOwners':
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
