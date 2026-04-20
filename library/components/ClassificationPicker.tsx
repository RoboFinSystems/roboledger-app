'use client'

export function ClassificationPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: string | null
  onSelect: (value: string | null) => void
  disabled?: boolean
}) {
  const balanceSheetClasses: Array<{
    value: string
    label: string
    title?: string
  }> = [
    { value: 'asset', label: 'Asset' },
    { value: 'contraAsset', label: 'Contra Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'contraLiability', label: 'Contra Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'contraEquity', label: 'Contra Equity' },
    { value: 'temporaryEquity', label: 'Temp. Equity' },
  ]
  const incomeStatementClasses: Array<{
    value: string
    label: string
    title?: string
  }> = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
    { value: 'expenseReversal', label: 'Exp. Reversal' },
    { value: 'gain', label: 'Gain' },
    { value: 'loss', label: 'Loss' },
    { value: 'comprehensiveIncome', label: 'OCI' },
    { value: 'investmentByOwners', label: 'Investment' },
    { value: 'distributionToOwners', label: 'Distribution' },
  ]

  const chipClass = (value: string) =>
    `rounded px-2 py-1 text-xs ${
      selected === value
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  const allClass = `rounded px-2 py-1 text-xs ${
    selected === null
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  return (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => onSelect(null)}
        disabled={disabled}
        className={allClass}
      >
        All
      </button>
      {balanceSheetClasses.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          disabled={disabled}
          title={c.title}
          className={chipClass(c.value)}
        >
          {c.label}
        </button>
      ))}
      <span className="mx-1 self-center text-gray-300 dark:text-gray-600">
        ·
      </span>
      {incomeStatementClasses.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          disabled={disabled}
          title={c.title}
          className={chipClass(c.value)}
        >
          {c.label}
        </button>
      ))}
      <span className="mx-1 self-center text-gray-300 dark:text-gray-600">
        ·
      </span>
      <button
        onClick={() => onSelect('abstract')}
        disabled={disabled}
        title="Abstract grouping concepts (hypercubes, RollUps, LineItems)."
        className={`rounded px-2 py-1 text-xs ${
          selected === 'abstract'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        Abstract
      </button>
    </div>
  )
}
