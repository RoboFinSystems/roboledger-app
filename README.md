# RoboSystems App

RoboSystems App is the web interface for the RoboSystems financial knowledge graph platform, providing tools to create, manage, and query graph databases.

- **Graph Database Management**: Create and manage multiple isolated graph databases with tiered infrastructure
- **AI Console**: Natural language and Cypher query terminal with streaming results and MCP integration
- **Schema Explorer**: Inspect node labels, relationships, constraints, and indexes
- **Subgraph Workspaces**: Create isolated environments for development, testing, and collaboration
- **Data Lake**: DuckDB staging tables for data validation and bulk ingestion
- **Shared Repository Access**: Subscribe to and query SEC XBRL filings and public financial data
- **Backup Management**: Create, download, and restore graph database backups
- **Billing & Usage**: Manage subscriptions, view invoices, and track credit usage
- **Organization Management**: Manage team members and organization settings

## Quick Start

```bash
npm install              # Install dependencies
cp .env.example .env     # Configure environment (edit with your API endpoint)
npm run dev              # Start development server
```

The application will be available at http://localhost:3000

## Development Commands

### Core Development

```bash
npm run dev              # Start development server (port 3000)
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
npm run pr:create        # Create pull request
npm run release:create   # Create GitHub release
npm run deploy:staging   # Deploy to staging environment
npm run deploy:prod      # Deploy to production
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

#### Deployment Requirements

- Fork this repo (and the [robosystems](https://github.com/RoboFinSystems/robosystems) backend)
- AWS account with IAM Identity Center (SSO)
- Run `npm run setup:bootstrap` to configure OIDC and GitHub variables

See the **[Bootstrap Guide](https://github.com/RoboFinSystems/robosystems/wiki/Bootstrap-Guide)** for complete instructions including access modes (internal, public-http, public).

## Architecture

**Application Layer:**

- Next.js 16 App Router
- TypeScript 5 for type safety
- Flowbite React with Tailwind CSS for UI components
- RoboSystems Client SDK for API communication

**Core Library (`/src/lib/core/`):**

Shared modules maintained as a git subtree across RoboSystems frontend apps:

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

- **`prod.yml`**: Production deployment to robosystems.ai
- **`staging.yml`**: Staging deployment to staging.robosystems.ai
- **`test.yml`**: Automated testing on pull requests
- **`build.yml`**: Docker image building for ECR

## Support

- [Issues](https://github.com/RoboFinSystems/robosystems-app/issues)
- [Wiki](https://github.com/RoboFinSystems/robosystems/wiki)
- [Projects](https://github.com/orgs/RoboFinSystems/projects)
- [Discussions](https://github.com/orgs/RoboFinSystems/discussions)

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

Apache-2.0 © 2026 RFS LLC
