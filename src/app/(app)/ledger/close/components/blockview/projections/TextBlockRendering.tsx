'use client'

import { MarkdownProse } from '@robosystems/core'
import type { FC } from 'react'
import { formatDate } from '../../../utils'
import type { EnvelopeBlock, EnvelopeRenderingRow } from '../types'

interface TextBlockRenderingProjectionProps {
  envelope: EnvelopeBlock
  entityName?: string | null
}

/**
 * Charlie's `Rendering` View projection — text-block disclosure
 * variant.
 *
 * A text-block note (`concept_arrangement` in `TEXT_BLOCK_CAPS`)
 * carries narrative bound from a platform Document via
 * `bind-text-block`, not a numeric grid: the server emits one
 * rendering row per Nonnumeric fact with the markdown in `textValue`
 * (see `robosystems/operations/information_block/text_block.py`).
 * This component renders each row as a titled prose section.
 */
const TextBlockRenderingProjection: FC<TextBlockRenderingProjectionProps> = ({
  envelope,
  entityName,
}) => {
  const rendering = envelope.view.rendering
  const rows = (rendering?.rows ?? []).filter(
    (row: EnvelopeRenderingRow) => row.textValue
  )

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No narrative bound to this note yet.
      </div>
    )
  }

  const periods = rendering?.periods ?? []

  return (
    <div>
      {/* Note header — mirrors the statement header treatment */}
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        {entityName && (
          <p className="text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-white">
            {entityName}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {envelope.name}
        </p>
        {periods.length > 0 && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {periods[0].start
              ? `For the Period Ended ${formatDate(periods[periods.length - 1].end)}`
              : formatDate(periods[periods.length - 1].end)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 py-4">
        {rows.map((row: EnvelopeRenderingRow, idx: number) => (
          <section key={`${row.elementId}-${idx}`}>
            {/* Element name as the section heading only when the note
                holds more than one narrative — a single-fact note's
                heading would just repeat the block header. */}
            {rows.length > 1 && (
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {row.elementName}
              </h3>
            )}
            <MarkdownProse size="sm">{row.textValue ?? ''}</MarkdownProse>
          </section>
        ))}
      </div>
    </div>
  )
}

export default TextBlockRenderingProjection
