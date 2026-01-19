# RoboLedger App

> **Version 0.2 (Beta)** — Core accounting features available, expanding integrations and automation

RoboLedger App is the web interface for AI-native accounting, building semantic knowledge graphs from financial data for intelligent automation and natural language analysis powered by Claude AI.

- **Semantic Financial Intelligence**: Every transaction connected semantically, preserving relationships and context for AI-powered insights
- **QuickBooks Integration**: Sync with existing QuickBooks data and add AI automation without changing workflows
- **Natural Language Queries**: Ask questions in plain English and get instant, intelligent answers about your finances
- **AI-Powered Automation**: Leverage Claude AI for intelligent financial analysis that understands business context
- **Multi-Source Data**: QuickBooks, Plaid bank feeds, SEC XBRL filings, and custom datasets
- **Enterprise-Ready**: SEC integration, process automation, report sharing, and API key authentication

## Core Features

### Available Now

- **Dashboard**: Financial overview with quick actions and AI insights
- **Ledger**: Chart of accounts, journal entries, trial balance, and account mappings
- **QuickBooks Sync**: Connect and synchronize with QuickBooks data
- **Console**: Interactive Cypher query terminal for graph exploration
- **Entities**: Multi-entity management across all graphs
- **AI Chat**: Natural language interface for financial queries and analysis
- **API Keys**: Secure programmatic access with `rlap_` bearer tokens
- **Settings**: User profile and notification preferences

### In Development

- **Reports**: Custom report builder with fact grids, templates, and multi-format export (PDF, Excel, CSV)
- **Plaid Connections**: Direct bank feeds for transaction synchronization
- **SEC XBRL**: Process SEC filings with US-GAAP taxonomy element mapping
- **Process Automation**: Visual workflow builder with scheduled tasks and triggers
- **Scheduled Reports**: Automated report generation and distribution

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

### Core Subtree Management

```bash
npm run core:pull        # Pull latest core subtree updates
npm run core:push        # Push core subtree changes
npm run core:add         # Add core subtree (initial setup)
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
- Plaid account (for bank connections) — optional

#### Deployment Requirements

- Fork this repo (and the [robosystems](https://github.com/RoboFinSystems/robosystems) backend)
- AWS account with IAM Identity Center (SSO)
- Run `npm run setup:bootstrap` to configure OIDC and GitHub variables

See the **[Bootstrap Guide](https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide)** for complete instructions including access modes (internal, public-http, public).

## Architecture

**Application Layer:**

- Next.js 15 App Router with React Server Components
- TypeScript 5 for type safety
- Flowbite React with Tailwind CSS for UI components
- NextAuth.js for authentication with OAuth providers (QuickBooks)
- RoboSystems Client SDK for API communication

**Key Features:**

- **Dashboard**: Financial overview with account balances, recent transactions, and AI-powered insights
- **Ledger**: Double-entry accounting with chart of accounts, journal entries, trial balance, and account mappings
- **Reports**: Custom report builder with fact grids, templates, and multi-format export (PDF, Excel, CSV) — _in development_
- **Connections**: Data source management for QuickBooks sync, Plaid bank feeds, and SEC filings
- **Console**: Interactive Cypher query terminal for direct graph exploration
- **Entities**: Multi-entity management across all graphs with parent/subsidiary relationships
- **AI Chat**: Natural language interface for financial queries and analysis

**Data Integrations:**

- **QuickBooks**: OAuth 2.0 authentication, company data import, transaction sync, automatic trial balance
- **Plaid**: Bank authentication via Plaid Link, multi-institution support, transaction feeds — _in development_
- **SEC XBRL**: CIK lookup, filing downloads (10-K, 10-Q, 8-K), US-GAAP element mapping — _in development_

**Core Library (`/src/lib/core/`):**

Shared modules maintained as a git subtree across RoboSystems frontend apps:

- Auth components (login, register, password reset)
- Session management and JWT handling
- Graph creation wizard and shared components
- Layout, forms, chat, and settings components
- User, company, graph, and credit contexts
- SSE-based background job progress tracking

**Infrastructure:**

- AWS App Runner with auto-scaling
- S3 + CloudFront for static asset hosting
- CloudFormation templates in `/cloudformation/`

## CI/CD

### Workflows

- **`prod.yml`**: Production deployment to roboledger.ai
- **`staging.yml`**: Staging deployment to staging.roboledger.ai
- **`test.yml`**: Automated testing on pull requests
- **`build.yml`**: Docker image building for ECR

### Infrastructure

- **AWS App Runner** with auto-scaling
- **S3 + CloudFront** for static asset hosting
- **CloudFormation** templates in `/cloudformation/`

## Support

- [Issues](https://github.com/RoboFinSystems/roboledger-app/issues)
- [Wiki](https://github.com/RoboFinSystems/robosystems/wiki)
- [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [Discussions](https://github.com/orgs/RoboFinSystems/discussions)

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

Apache-2.0 © 2025 RFS LLC
