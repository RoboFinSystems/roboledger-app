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
  const stockClasses: Array<{ value: string; label: string }> = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
  ]
  const flowClasses: Array<{ value: string; label: string; title?: string }> = [
    { value: 'inflow', label: 'Inflow', title: 'Credit-flow primitive (was revenue + gain)' },
    { value: 'outflow', label: 'Outflow', title: 'Debit-flow primitive (was expense + loss)' },
    {
      value: 'cashflow',
      label: 'Cash Flow',
      title: 'Net cash movements + period-over-period movements',
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

  return (
    <div className="flex flex-wrap gap-1">
      <button onClick={() => onSelect(null)} disabled={disabled} className={allClass}>
        All
      </button>
      {stockClasses.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          disabled={disabled}
          className={chipClass(c.value)}
        >
          {c.label}
        </button>
      ))}
      <span className="mx-1 self-center text-gray-300 dark:text-gray-600">·</span>
      {flowClasses.map((c) => (
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
      <span className="mx-1 self-center text-gray-300 dark:text-gray-600">·</span>
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
