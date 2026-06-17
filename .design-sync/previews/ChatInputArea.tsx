import { ChatInputArea } from '@robosystems/core'

const noopRef = { current: null } as React.RefObject<HTMLTextAreaElement>

/** Idle input: deep-research lightbulb (off), textarea with a typed question, send button. */
export const Idle = () => (
  <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <ChatInputArea
      input="Compare gross margin across Acme Corp's reporting segments"
      loading={false}
      dots=""
      forceDeepResearch={false}
      textareaRef={noopRef}
      placeholder="Ask about entities, filings, or revenue…"
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSendMessage={() => {}}
      onToggleDeepResearch={() => {}}
    />
  </div>
)

/** Empty input with the placeholder showing and deep-research enabled (lit lightbulb). */
export const EmptyWithDeepResearch = () => (
  <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <ChatInputArea
      input=""
      loading={false}
      dots=""
      forceDeepResearch={true}
      textareaRef={noopRef}
      placeholder="Ask about entities, filings, or revenue…"
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSendMessage={() => {}}
      onToggleDeepResearch={() => {}}
    />
  </div>
)

/** Loading state: textarea is disabled and shows the animated "Deep research…" status. */
export const LoadingDeepResearch = () => (
  <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <ChatInputArea
      input="Map the subsidiary structure for Acme Corp"
      loading={true}
      dots="..."
      forceDeepResearch={true}
      textareaRef={noopRef}
      onInputChange={() => {}}
      onKeyDown={() => {}}
      onSendMessage={() => {}}
      onToggleDeepResearch={() => {}}
    />
  </div>
)
