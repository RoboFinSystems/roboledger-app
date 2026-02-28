export default function AiIntegrationMcp() {
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-purple-400/40 bg-gradient-to-br from-purple-950/60 via-purple-900/40 to-pink-950/60 shadow-2xl shadow-purple-500/20">
      <div className="p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50">
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white">
              AI Integration via MCP
            </h3>
            <p className="text-lg text-purple-200">
              Connect Claude Desktop, Claude Code, or any MCP client
            </p>
          </div>
        </div>

        <p className="mb-6 text-gray-300">
          Use the Model Context Protocol (MCP) to give AI assistants direct
          access to your financial data. Ask questions in natural language and
          let Claude query your knowledge graph automatically.
        </p>

        <div className="mb-6 space-y-3">
          <h4 className="text-lg font-semibold text-white">
            Integration Options:
          </h4>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start">
              <span className="mr-2 text-purple-400">✓</span>
              <strong className="text-white">Claude Desktop:</strong>
              <span className="ml-1">
                Add to your config for conversational financial analysis
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-purple-400">✓</span>
              <strong className="text-white">Claude Code:</strong>
              <span className="ml-1">
                Query financial data while coding and building applications
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-purple-400">✓</span>
              <strong className="text-white">Custom MCP Clients:</strong>
              <span className="ml-1">
                Build your own AI-powered financial tools
              </span>
            </li>
          </ul>
        </div>

        <div className="mb-6 rounded-xl bg-black/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Claude Desktop Configuration (claude_desktop_config.json):
          </h4>
          <pre className="overflow-x-auto text-sm text-gray-300">
            <code>{`{
  "mcpServers": {
    "robosystems": {
      "command": "npx",
      "args": ["-y", "@robosystems/mcp"],
      "env": {
        "ROBOSYSTEMS_API_URL": "http://localhost:8000",
        "ROBOSYSTEMS_API_KEY": "rfs_your_api_key_here",
        "ROBOSYSTEMS_GRAPH_ID": "sec"
      }
    }
  }
}`}</code>
          </pre>
        </div>

        <div className="space-y-4 rounded-xl bg-black/50 p-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">
              Query Your Knowledge Graph:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "What was Apple's revenue for the last 5 years?"
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "Compare NVIDIA and AMD net income trends"
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "Show me Tesla's total assets by quarter"
              </li>
            </ul>
          </div>
          <div className="border-t border-purple-500/20 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-white">
              AI Memory & Workspaces:
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "Create a memory workspace and save what we found about margins"
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "What patterns did we identify in last quarter's analysis?"
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-purple-400">•</span>
                "Fork the graph into an analytical workspace"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
