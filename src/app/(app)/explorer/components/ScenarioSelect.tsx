'use client'

import { Select } from 'flowbite-react'
import type { FC } from 'react'

export interface ScenarioOption {
  id: string
  name: string
}

interface ScenarioSelectProps {
  /** Forecast blocks in the graph — each one IS a scenario. */
  scenarios: ScenarioOption[]
  /** Selected scenario (forecast block structure id); null = actuals. */
  selectedId: string | null
  onChange: (scenarioId: string | null) => void
}

/**
 * Scenario picker — the read filter over the envelope's FactSet slice.
 * "Actuals" (the default) reads the null scenario; picking a forecast
 * block reads its parallel universe: statement envelopes bind the
 * latest computed month, metric envelopes extend their series with
 * "(forecast)"-labeled columns. Hidden entirely when the graph has no
 * forecast blocks — the control only exists once a scenario does.
 */
const ScenarioSelect: FC<ScenarioSelectProps> = ({
  scenarios,
  selectedId,
  onChange,
}) => {
  if (scenarios.length === 0) return null

  return (
    <Select
      sizing="sm"
      value={selectedId ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      aria-label="Scenario"
    >
      <option value="">Actuals</option>
      {scenarios.map((scenario) => (
        <option key={scenario.id} value={scenario.id}>
          {scenario.name}
        </option>
      ))}
    </Select>
  )
}

export default ScenarioSelect
