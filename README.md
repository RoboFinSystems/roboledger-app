# RoboLedger App

RoboLedger App is the web interface for AI-native accounting, building semantic knowledge graphs from financial data for intelligent automation and natural language analysis powered by Claude AI.

- **Semantic Financial Intelligence**: Every transaction connected semantically, preserving relationships and context for AI-powered insights
- **QuickBooks Integration**: Sync with existing [QuickBooks](https://quickbooks.intuit.com/partners/affiliates?cid=par_pim_4TcakSEFQs73) data and add AI automation without changing workflows
- **Natural Language Queries**: Ask questions in plain English and get instant, intelligent answers about your finances
- **AI-Powered Automation**: Leverage Claude AI for intelligent financial analysis that understands business context
- **Multi-Source Data**: QuickBooks, SEC XBRL filings, and custom datasets

## Core Features

- **Dashboard**: Financial overview with quick actions
- **Ledger**: Chart of accounts, journal entries, trial balance, and account mappings
- **Period Close**: Fiscal calendar bootstrap, close workflow with gate checks, and rule-based pre-close evaluation
- **Live Statements**: Render balance sheet, income statement, and cash flow directly from the current ledger — no period close required
- **Schedules**: Recurring journal entry templates with auto-evaluation on close
- **Inbox**: Event block review for rule violations and pending obligations
- **Reports**: Custom report builder with fact grids, statement and text-block disclosure rendering, templates, publish lists, and multi-format export
- **Block Explorer**: Browse Information Blocks and their fact-set views with on-the-fly metric computation
- **Mapping Workbench**: Configure taxonomy framework mappings with AI suggestions and the automapper operator
- **Connections**: QuickBooks OAuth sync and SEC XBRL filings
- **Entity Detail**: Per-entity details and configuration
- **Agents**: AI agent management with conversation history and tool access
- **AI Console**: Natural language and Cypher query terminal with streaming results and MCP integration
- **Document Search**: Full-text and semantic search across uploaded documents and connected sources
- **Library**: Browse canonical taxonomies, elements, and reference data
- **Entities**: Multi-entity management across all graphs
- **API Keys**: Secure programmatic access with `rfs`-prefixed API keys
- **Settings**: User profile and password management

## Quick Start

```bash
npm install              # Install dependencies
cp .env.example .env     # Configure environment (edit with your API endpoint)
npm run dev              # Start development server
```

The application will be available at http://localhost:3001

## Development Commands

### Core Development

```bash
npm run dev              # Start development server (port 3001)
npm run build            # Production build
```

### Testing

```bash
npm run test:all         # All tests and code quality checks
npm run test             # Run Vitest test suite
npm run test:coverage    # Generate coverage report
```

### Code Quality

```bash
npm run lint             # ESLint validation
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier code formatting
npm run format:check     # Check formatting compliance
npm run typecheck        # TypeScript type checking
```

### SDLC Commands

```bash
npm run feature:create   # Create a feature branch
npm run release:create   # Create GitHub release
npm run deploy:staging   # Deploy to staging environment
npm run deploy:prod      # Deploy to production
```

### Shared Core Library

Shared components live in the [`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core) npm package (repo: [robosystems-core](https://github.com/RoboFinSystems/robosystems-core)). Bump the pinned version to pick up changes:

```bash
npm install @robosystems/core@latest
```

### Prerequisites

#### System Requirements

- Node.js 22+ (LTS recommended)
- npm 10+
- 4GB RAM minimum
- Modern browser (Chrome, Firefox, Safari, Edge)

#### Required Services

- RoboSystems API endpoint (local development or production)
- Intuit Developer account (for QuickBooks OAuth)

#### Deployment Requirements

- Fork this repo (and the [robosystems](https://github.com/RoboFinSystems/robosystems) backend)
- AWS account with IAM Identity Center (SSO)
- Run `npm run setup:bootstrap` to configure OIDC and GitHub variables

See the **[Bootstrap Guide](https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide)** for complete instructions including access modes (internal, public).

## Architecture

**Application Layer:**

- Next.js 16 App Router
- TypeScript 5 for type safety
- Flowbite React with Tailwind CSS for UI components
- RoboSystems Client SDK for API communication
- Statement and report rendering via [`@robosystems/report-components`](https://www.npmjs.com/package/@robosystems/report-components)
- Intuit OAuth for QuickBooks integration

**Core Library ([`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core)):**

Shared modules consumed as an npm package across RoboSystems frontend apps:

- Auth components (login, register, password reset)
- Session management and JWT handling
- Graph creation wizard and shared components
- Layout, forms, chat, and settings components
- Graph, organization, and entity contexts
- SSE-based background job progress tracking

**Infrastructure:**

- AWS App Runner with auto-scaling
- S3 + CloudFront for static asset hosting
- CloudFormation templates in `/cloudformation/`

## CI/CD

- **`prod.yml`**: Production deployment to roboledger.ai
- **`staging.yml`**: Staging deployment to staging.roboledger.ai
- **`test-ci.yml`**: Automated testing on pull requests
- **`build.yml`**: Reusable Docker image build for ECR, invoked by the deploy workflows

## Support

- [Issues](https://github.com/RoboFinSystems/roboledger-app/issues)
- [Wiki](https://github.com/RoboFinSystems/robosystems/wiki)
- [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [Discussions](https://github.com/orgs/RoboFinSystems/discussions)

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

Apache-2.0 © 2026 RFS LLC
