'use client'

import type { LedgerFlowCandidate } from '@robosystems/client/clients'
import { Select } from 'flowbite-react'
import type { FC } from 'react'

const FLOW_SECTIONS: { activity: string; label: string }[] = [
  { activity: 'investing', label: 'Investing' },
  { activity: 'financing', label: 'Financing' },
]

interface FlowRowSelectProps {
  id: string
  /** The selected row's qname; '' is the account's default flow. */
  value: string
  onChange: (qname: string) => void
  flows: LedgerFlowCandidate[] | null
  flowsFailed: boolean
  disabled?: boolean
  /**
   * The tag the line already carries. It stays selectable when the loaded
   * rows do not offer it (a Style change, a failed load), and says so.
   */
  priorQname?: string
  sizing?: 'sm' | 'md'
  'aria-label'?: string
}

/**
 * The cash flow row a line is tagged with: the statement's investing and
 * financing rows by section, with the account's default flow first. Only for
 * a loan drawn or repaid, capital put in or taken out, or an asset bought or
 * sold; everything else keeps the default.
 */
export const FlowRowSelect: FC<FlowRowSelectProps> = ({
  id,
  value,
  onChange,
  flows,
  flowsFailed,
  disabled = false,
  priorQname = '',
  sizing = 'md',
  'aria-label': ariaLabel,
}) => {
  const stranded =
    priorQname &&
    flows !== null &&
    !flowsFailed &&
    !flows.some((flow) => flow.qname === priorQname)
      ? priorQname
      : null
  const unloaded = priorQname && flowsFailed ? priorQname : null

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || flows === null}
      sizing={sizing}
      aria-label={ariaLabel}
    >
      <option value="">
        {flows === null ? 'Loading cash flow rows…' : "Account's default flow"}
      </option>
      {stranded && (
        <option value={stranded}>
          {stranded} (not a row of this statement)
        </option>
      )}
      {unloaded && <option value={unloaded}>{unloaded}</option>}
      {FLOW_SECTIONS.map((section) => {
        const rows = (flows ?? []).filter(
          (flow) => flow.activity === section.activity
        )
        if (rows.length === 0) return null
        return (
          <optgroup key={section.activity} label={section.label}>
            {rows.map((flow) => (
              <option key={flow.qname} value={flow.qname}>
                {flow.name}
              </option>
            ))}
          </optgroup>
        )
      })}
    </Select>
  )
}
