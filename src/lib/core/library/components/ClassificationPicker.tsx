'use client'

export function ClassificationPicker({
  selected,
  onSelect,
  activity,
  onActivityChange,
  disabled,
}: {
  selected: string | null
  onSelect: (value: string | null) => void
  /** Cash-flow activity axis (orthogonal to SFAC 6 EFS). Optional — omit to hide. */
  activity?: string | null
  onActivityChange?: (value: string | null) => void
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
  const activityClasses: Array<{
    value: string
    label: string
    title?: string
  }> = [
    {
      value: 'operatingActivity',
      label: 'Operating',
      title: 'Cash flows from operating activities',
    },
    {
      value: 'investingActivity',
      label: 'Investing',
      title: 'Cash flows from investing activities',
    },
    {
      value: 'financingActivity',
      label: 'Financing',
      title: 'Cash flows from financing activities',
    },
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

  const activityChipClass = (value: string) =>
    `rounded px-2 py-1 text-xs ${
      activity === value
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  const showActivity = onActivityChange !== undefined

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
      <button
        onClick={() => onSelect('metric')}
        disabled={disabled}
        title="Derived metrics / subtotals (Net Income, Gross Profit, Comprehensive Income totals). Not SFAC 6 primary elements."
        className={`rounded px-2 py-1 text-xs ${
          selected === 'metric'
            ? 'bg-pink-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        Metric
      </button>
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
      {showActivity && (
        <>
          <span className="mx-1 self-center text-gray-300 dark:text-gray-600">
            ·
          </span>
          {activityClasses.map((c) => (
            <button
              key={c.value}
              onClick={() =>
                onActivityChange?.(activity === c.value ? null : c.value)
              }
              disabled={disabled}
              title={c.title}
              className={activityChipClass(c.value)}
            >
              {c.label}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
