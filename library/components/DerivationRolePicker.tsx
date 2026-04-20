'use client'

export function DerivationRolePicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: string | null
  onSelect: (value: string | null) => void
  disabled?: boolean
}) {
  const values: Array<{ value: string; label: string; title?: string }> = [
    {
      value: 'primitive',
      label: 'Primitive',
      title: 'Leaf element — basic stock, flow, or CF delta',
    },
    {
      value: 'aggregate',
      label: 'Aggregate',
      title: 'RollUp head (subtotals, totals, NetCashFlow rollups)',
    },
    {
      value: 'ratio',
      label: 'Ratio',
      title: 'Computed metric (ROA, CurrentRatio)',
    },
    {
      value: 'identifier',
      label: 'Identifier',
      title: 'Entity/document metadata',
    },
    {
      value: 'structural',
      label: 'Structural',
      title: 'Abstracts, hypercubes, LineItems — grouping only',
    },
  ]
  const chip = (active: boolean) =>
    `rounded px-2 py-1 text-xs ${
      active
        ? 'bg-amber-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  return (
    <div className="flex flex-wrap gap-1">
      <span className="self-center pr-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        Role
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
