import { ChatMessage } from '@robosystems/core'

/** A user question, right-aligned on the brand secondary surface. */
export const UserMessage = () => (
  <div className="w-full max-w-2xl">
    <ChatMessage
      message={{
        id: 'm1',
        user: 'You',
        text: 'What was the year-over-year revenue growth for Acme Corp across its last three 10-K filings?',
      }}
    />
  </div>
)

/** An agent reply, left-aligned, with rendered markdown (headings, list, code). */
export const AgentMarkdownReply = () => (
  <div className="w-full max-w-2xl">
    <ChatMessage
      message={{
        id: 'm2',
        user: 'Agent',
        text: '### Revenue Growth Summary\n\nAcme Corp reported steady top-line expansion:\n\n- **FY2023:** $1.42B (+11.8%)\n- **FY2022:** $1.27B (+9.4%)\n- **FY2021:** $1.16B\n\nThe figures were sourced from the `Revenues` concept on each filing:\n\n```cypher\nMATCH (e:Entity {name: "Acme Corp"})-[:FILED]->(f:Report)\nRETURN f.fiscalYear, f.revenue ORDER BY f.fiscalYear DESC\n```',
      }}
    />
  </div>
)

/** A streaming agent response — spinner badge plus a progress bar. */
export const StreamingWithProgress = () => (
  <div className="w-full max-w-2xl">
    <ChatMessage
      message={{
        id: 'm3',
        user: 'Agent',
        text: 'Pulling the latest filings and reconciling segment revenue across repositories…',
        isPartial: true,
        progress: 62,
        currentStep: 'Aggregating segment-level facts',
      }}
    />
  </div>
)

/** A completed deep-research answer — clock badge marks the long-running task. */
export const DeepResearchResult = () => (
  <div className="w-full max-w-2xl">
    <ChatMessage
      message={{
        id: 'm4',
        user: 'Agent',
        taskId: 'task_9f3a',
        text: 'After analyzing 14 filings across 3 repositories, the entity graph links **Acme Corp** to two newly consolidated subsidiaries, raising reported revenue by roughly $180M in FY2023.',
      }}
    />
  </div>
)
