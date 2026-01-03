# Contributing to RoboLedger App

Thank you for your interest in contributing to RoboLedger App! This is the accounting and bookkeeping interface for the RoboSystems platform.

## Community

- **[Discussions](https://github.com/orgs/RoboFinSystems/discussions)** - Questions, ideas, and general conversation
- **[Project Board](https://github.com/orgs/RoboFinSystems/projects/3)** - Track work across all RoboSystems repositories
- **[Wiki](https://github.com/RoboFinSystems/robosystems/wiki)** - Architecture docs and guides

## Table of Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/roboledger-app.git
   cd roboledger-app
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/RoboFinSystems/roboledger-app.git
   ```
4. **Set up your development environment** (see [Development Setup](#development-setup))

## Development Process

We use GitHub flow with automated tooling for our development process:

1. Create a feature branch using our tooling
2. Make your changes in small, atomic commits
3. Write or update tests for your changes
4. Update documentation as needed
5. Create a Claude-powered PR to the `main` branch

### Branch Creation and Naming

Use our automated branch creation tool with `npm`:

```bash
# Create a new feature branch
npm run feature:create feature add-reconciliation main

# Create a bugfix branch
npm run feature:create bugfix fix-balance-calculation main

# Create a hotfix branch
npm run feature:create hotfix critical-auth-patch main

# Create a chore branch
npm run feature:create chore update-dependencies main

# Create a refactor branch
npm run feature:create refactor improve-error-handling main
```

**Branch Types:**

- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes for existing functionality
- `hotfix/` - Critical fixes that need immediate attention
- `chore/` - Maintenance tasks (deps, configs, etc.)
- `refactor/` - Code refactoring without functional changes

**Note:** All PRs must target the `main` branch only.

## How to Contribute

### Issue Types

We use issue templates to organize work. Choose the right type based on your contribution:

| Type        | When to Use                                           |
| ----------- | ----------------------------------------------------- |
| **Bug**     | Defects or unexpected behavior                        |
| **Task**    | Specific, bounded work that fits in one PR            |
| **Feature** | Request a new capability (no design required)         |
| **RFC**     | Propose a design for discussion before implementation |
| **Spec**    | Approved implementation plan ready for execution      |

**Workflow for larger features:**

1. **Feature** → Capture the need ("I wish I could...")
2. **RFC** → Propose and discuss the design approach
3. **Spec** → Document the approved implementation plan

### Reporting Bugs

Before creating a bug report, check existing issues to avoid duplicates. Include:

- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser)
- Relevant console logs or error messages
- Screenshots if applicable

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted`. These are great starting points for new contributors.

## Development Setup

### Prerequisites

- Node.js 22.x+ (check `.nvmrc`)
- npm 10.x+
- Git configured with your GitHub account
- VS Code (recommended) with recommended extensions

### Local Development Environment

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

### Environment Configuration

Create a `.env` file with required configuration:

```env
# Required
NEXT_PUBLIC_ROBOSYSTEMS_API_URL=https://api.robosystems.ai  # or http://localhost:8000 for local

# Optional
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

## Coding Standards

### TypeScript Code Style

- **Formatter**: Prettier with configuration
- **Linter**: ESLint with Next.js rules
- **Type checking**: TypeScript strict mode
- **Import sorting**: Prettier plugin

Run code quality checks:

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
npm run typecheck     # TypeScript type checking
```

### Commit Messages

Follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements

Examples:

```
feat(ledger): add transaction reconciliation
fix(accounts): resolve balance calculation issue
docs(readme): update deployment instructions
```

### Code Organization

- Follow existing project structure
- Use functional components with hooks
- Keep components focused and single-purpose
- Add TypeScript types for all props and returns
- Write JSDoc comments for complex logic

## Testing

### Test Requirements

- All new features must include tests
- Bug fixes should include regression tests
- Maintain or improve code coverage
- Tests must pass locally before submitting PR

### Running Tests

```bash
# Run all tests
npm run test:all

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- TransactionList.test.tsx
```

### Writing Tests

- Use React Testing Library for component tests
- Use Vitest for unit tests
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

## Documentation

### Documentation Requirements

- Update README.md for significant changes
- Add JSDoc comments to exported functions
- Update component documentation
- Include inline comments for complex logic
- Update environment variable documentation if needed

## Pull Request Process

### Before Creating a PR

1. **Commit all changes**:

   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

2. **Update from upstream**:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Run all checks locally**:

   ```bash
   npm run test:all
   ```

4. **Push your branch**:
   ```bash
   git push origin your-branch-name
   ```

### PR Requirements

- All tests must pass
- Code must pass linting and formatting checks
- Must not decrease test coverage significantly
- Must include appropriate documentation updates
- Must be reviewed by at least one maintainer

### Manual PR Creation

```bash
gh pr create --base main --title "Your PR title" --body "Your PR description"
```

## Security

### Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security@robosystems.ai with details
2. Include steps to reproduce if possible
3. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Keep dependencies up to date
- Follow OWASP guidelines for web security

## Core Library Management

The `/src/lib/core` directory is a git subtree shared across RoboSystems apps:

```bash
# Pull latest core changes
npm run core:pull

# Push core changes (coordinate with team)
npm run core:push

# Initial subtree setup (rarely needed)
npm run core:add
```

**Important**: Core library changes affect multiple applications. Coordinate with the team before pushing changes.

## Questions and Support

- **[GitHub Discussions](https://github.com/orgs/RoboFinSystems/discussions)** - Best place for questions and community conversation
- **[GitHub Issues](https://github.com/RoboFinSystems/roboledger-app/issues)** - Bug reports and feature requests for this repo
- **[API Reference](https://api.robosystems.ai/docs)** - Backend API documentation
- **Email**: security@robosystems.ai for security issues only

## Recognition

Contributors will be recognized in our [Contributors](https://github.com/RoboFinSystems/roboledger-app/graphs/contributors) page.

Thank you for contributing to RoboLedger App!
