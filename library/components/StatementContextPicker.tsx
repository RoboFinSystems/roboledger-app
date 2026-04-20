'use client'

export function StatementContextPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: string | null
  onSelect: (value: string | null) => void
  disabled?: boolean
}) {
  const values: Array<{ value: string; label: string; title?: string }> = [
    { value: 'balance_sheet', label: 'BS' },
    { value: 'income_statement', label: 'IS' },
    { value: 'cash_flow', label: 'CF' },
    { value: 'equity_changes', label: 'Equity Δ' },
    { value: 'disclosure', label: 'Disclosure' },
    { value: 'metadata', label: 'Metadata', title: 'Entity / document identifiers' },
    { value: 'analysis', label: 'Analysis', title: 'Ratios / computed metrics' },
  ]
  const chip = (active: boolean) =>
    `rounded px-2 py-1 text-xs ${
      active
        ? 'bg-teal-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  return (
    <div className="flex flex-wrap gap-1">
      <span className="self-center pr-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        Context
      </span>
      <button
        onClick={() => onSelect(null)}
        disabled={disabled}
        className={chip(selected === null)}
      >
        All
      </button>
      {values.map((v) => (
        <button
          key={v.value}
          onClick={() => onSelect(v.value)}
          disabled={disabled}
          title={v.title}
          className={chip(selected === v.value)}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
