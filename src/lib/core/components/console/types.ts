export interface SampleQuery {
  name: string
  query: string
}

export interface ConsoleWelcomeConfig {
  /** e.g. "RoboSystems Console", "RoboLedger Console" */
  consoleName: string
  /** e.g. "Claude powered interactive graph database console" */
  description: string
  /** Label for the context identifier: "Graph" | "Portfolio" */
  contextLabel: string
  /** Example natural-language prompts shown in USAGE section */
  naturalLanguageExamples: string[]
  /** Example /query Cypher lines shown in USAGE section */
  directQueryExamples: string[]
  /** Final line of the welcome message, e.g. "How can I help you today?" */
  closingMessage: string
}

export interface ConsoleHeaderConfig {
  /** Page heading, e.g. "Console" */
  title: string
  /** Subtitle below heading */
  subtitle: string
  /** Tailwind gradient-from class, e.g. "from-blue-500" */
  gradientFrom: string
  /** Tailwind gradient-to class, e.g. "to-purple-600" */
  gradientTo: string
}

export interface ConsoleMcpConfig {
  /** MCP server name in the JSON config, e.g. "robosystems" */
  serverName: string
  /** npm package name, e.g. "@robosystems/mcp" */
  packageName: string
  /** Example questions shown after MCP setup */
  exampleQuestions: string[]
  /** Fallback text for graph ID placeholder, e.g. "your_graph_id" */
  contextIdFallback: string
}

export interface ConsoleCommandContext {
  addSystemMessage: (content: string, animate?: boolean) => void
  addErrorMessage: (content: string) => void
  graphId: string | null
}

export interface ConsoleExtraCommand {
  /** The slash command string, e.g. "/api-keys" */
  command: string
  /** Handler called when the command is invoked */
  handler: (context: ConsoleCommandContext) => void | Promise<void>
}

export interface ConsoleConfig {
  welcome: ConsoleWelcomeConfig
  header: ConsoleHeaderConfig
  mcp: ConsoleMcpConfig
  sampleQueries: SampleQuery[]
  /** Label for the /examples output heading, e.g. "Example Cypher Queries:" */
  examplesLabel: string
  /** Error message when no graph/portfolio is selected */
  noSelectionError: string
  /** Extra slash commands beyond the built-in set */
  extraCommands?: ConsoleExtraCommand[]
}

export interface TerminalMessage {
  id: string
  type: 'system' | 'user' | 'result' | 'error'
  content: string
  timestamp: Date
  data?: any
  isAnimating?: boolean
}
