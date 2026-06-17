import { ChatHeader } from '@robosystems/core'

/** Default header: robot icon, heading, and the agent description on the right. */
export const Default = () => (
  <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <ChatHeader
      agentType="default"
      setAgentType={() => {}}
      loading={false}
      title="Financial Analysis"
      agentDescription="Knowledge Graph Agent"
    />
  </div>
)

/** Custom title with a longer agent description and active tasks running. */
export const WithActiveTasks = () => (
  <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800">
    <ChatHeader
      agentType="default"
      setAgentType={() => {}}
      loading={true}
      title="Acme Corp Workspace"
      activeTasks={2}
      agentDescription="Deep Research Agent"
    />
  </div>
)
