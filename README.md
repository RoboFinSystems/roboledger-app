# RoboLedger App

RoboLedger is an AI-native accounting platform that builds a semantic knowledge graph of your financial data, enabling intelligent automation and natural language financial analysis powered by Claude AI.

- **Semantic Financial Intelligence**: Every transaction connected semantically, preserving relationships and context for AI-powered insights
- **Flexible Deployment Options**: QuickBooks integration layer, standalone with Plaid bank feeds, or fork and deploy to your own AWS infrastructure
- **Natural Language Queries**: Ask questions in plain English and get instant, intelligent answers about your finances
- **AI-Powered Automation**: Leverage Claude AI for intelligent financial analysis that understands business context
- **Enterprise-Ready**: SEC integration, process automation, report sharing, and API key authentication

## Core Features

RoboLedger transforms traditional financial data storage from isolated tables into a connected, intelligent system that enables AI agents to understand business context, not just rules.

- **Knowledge Graph Architecture**: Financial data modeled as a semantic graph preserving relationships and context
- **QuickBooks Intelligence Layer**: Sync with existing QuickBooks data and add AI automation without changing workflows
- **Complete Financial Platform**: Direct bank connections via Plaid with built-in double-entry accounting
- **SEC Integration**: Process SEC XBRL filings with intelligent automation
- **Process Automation**: RPA tools for automating reporting processes and schedules
- **Report Sharing**: Create and share reports with shareholders and stakeholders
- **API Key Authentication**: Secure programmatic access for integrations

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone https://github.com/RoboFinSystems/roboledger-app.git
cd roboledger-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
```

The application will be available at: http://localhost:3001

### Docker Development

```bash
# Build and run with Docker
docker build -t roboledger-app .
docker run -p 3001:3000 --env-file .env roboledger-app
```

## Development Commands

### Core Development

```bash
npm run dev              # Start development server (port 3001)
npm run build           # Production build with optimization
```

### Code Quality

```bash
npm run lint            # ESLint validation
npm run lint:fix        # Auto-fix linting issues
npm run format          # Prettier code formatting
npm run format:check    # Check formatting compliance
npm run typecheck       # TypeScript type checking
```

### Testing

```bash
npm run test            # Run Vitest test suite
npm run test:watch      # Interactive test watch mode
npm run test:coverage   # Generate coverage report
```

### Prerequisites

#### System Requirements

- Node.js 22+ (LTS recommended)
- npm 10+ or yarn 1.22+
- 4GB RAM minimum
- Modern browser (Chrome, Firefox, Safari, Edge)

#### Required Services

- RoboSystems API endpoint (production or development)
- Intuit Developer account (for QuickBooks OAuth)
- Optional: AWS account for production deployment

## Architecture

### Application Layer

- **Next.js 15 App Router** with React Server Components for optimal performance
- **TypeScript 5** for type safety and developer experience
- **Flowbite React Components** with Tailwind CSS for consistent UI
- **RoboSystems Client SDK** for API communication and authentication

### Key Application Features

#### Dashboard (`/app/(app)/dashboard/`)

The primary interface for financial overview:

- **Financial Summary**: Key metrics and account balances at a glance
- **Recent Transactions**: Latest activity across all accounts
- **AI Insights**: Claude-powered analysis of financial trends

#### Ledger (`/app/(app)/ledger/`)

Double-entry accounting interface:

- **Chart of Accounts**: Hierarchical account structure management
- **Journal Entries**: Create and review journal entries
- **Trial Balance**: Real-time trial balance with drill-down capability
- **Financial Statements**: Balance sheet, income statement, cash flow

#### Reports (`/app/(app)/reports/`)

Financial reporting and analysis:

- **Report Builder**: Create custom financial reports
- **Report Templates**: Pre-built templates for common reports
- **Export Options**: PDF, Excel, and CSV export
- **Scheduled Reports**: Automated report generation and distribution

#### Process Automation (`/app/(app)/processes/`)

RPA tools for workflow automation:

- **Process Designer**: Visual workflow builder
- **Scheduled Tasks**: Automated recurring processes
- **Integration Triggers**: Event-driven automation

#### Companies (`/app/(app)/companies/`)

Multi-company management:

- **Company Setup**: Configure company settings and preferences
- **QuickBooks Sync**: Connect and sync with QuickBooks
- **Bank Connections**: Plaid integration for bank feeds

### Core Library (`/src/lib/core/`)

Shared authentication and utility modules maintained as a git subtree:

- **Auth Components**: Login/register forms with RoboLedger branding
- **Auth Core**: Session management and JWT handling
- **UI Components**: Consistent interface elements across RoboSystems apps
- **Contexts**: User, company, and credit system contexts

### GitHub Actions Workflows

#### Primary Deployment Workflows

- **`prod.yml`**: Production deployment pipeline
  - Manual deployment via workflow_dispatch
  - Deploys to roboledger.ai with S3 static hosting
  - Full testing, build, and ECS deployment
  - Auto-scaling configuration with Fargate Spot

- **`staging.yml`**: Staging environment deployment
  - Manual workflow dispatch
  - Deploys to staging.roboledger.ai
  - Integration testing environment

- **`test.yml`**: Automated testing suite
  - Runs on pull requests and main branch
  - TypeScript, ESLint, and Prettier checks
  - Vitest unit and integration tests
  - Build verification

- **`build.yml`**: Docker image building
  - Multi-architecture support (AMD64/ARM64)
  - Pushes to Amazon ECR
  - Static asset upload to S3

### CloudFormation Templates

Infrastructure as Code templates in `/cloudformation/`:

- **`template.yaml`**: Complete ECS Fargate stack with auto-scaling
- **`s3.yaml`**: Static asset hosting for CloudFront CDN

## Support

- Issues: [GitHub Issues](https://github.com/RoboFinSystems/roboledger-app/issues)
- Discussions: [GitHub Discussions](https://github.com/RoboFinSystems/roboledger-app/discussions)
- Wiki: [GitHub Wiki](https://github.com/RoboFinSystems/roboledger-app/wiki)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Apache-2.0 © 2025 RFS LLC
