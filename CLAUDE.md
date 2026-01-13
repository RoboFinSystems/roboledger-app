# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Commands

```bash
# Start development server
npm run dev

# Build dev test
npm run build:dev

# Run all tests
npm test

# Generate test coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Testing Commands

```bash
# Run a specific test file
npm test -- src/components/__tests__/ChatDrawer.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"

# Update test snapshots
npm test -- -u
```

## Architecture Overview

This is a Next.js 14 application using the App Router pattern that connects to the RoboSystems API for all backend operations.

### Frontend Architecture

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI Components**: Flowbite React components with Tailwind CSS styling
- **State Management**: React Context API for sidebar and auth state
- **Authentication**: NextAuth.js with OAuth providers (QuickBooks)

### API Structure

The application follows RESTful patterns with API routes under `/api/`:

- `/api/auth/*` - Authentication endpoints (NextAuth)
- `/api/company/*` - Company and accounting data management
- `/api/user/*` - User profile and settings
- `/api/qb/*` - QuickBooks integration
- `/api/sec/*` - SEC filings integration
- `/api/chat/*` - AI chat integration

### Backend Architecture

- **RoboSystems API**: All data operations, business logic, and database interactions are handled by the RoboSystems API
- **Authentication**: OAuth-based authentication with session management

### API Key Authentication

- **Format**: Bearer tokens with `rlap_` prefix (e.g., `Authorization: Bearer rlap_xxx`)
- **Auto-creation**: Default API key generated on user registration
- **Middleware**: Custom authentication middleware for API routes (`lib/apiKeys/middleware.ts`)
- **System Keys**: Special `is_system` flag for internal service authentication

### Key Services Integration

- **RoboSystems API**: Primary backend service for all data operations
- **QuickBooks**: OAuth integration for accounting data import (via RoboSystems API)
- **Authentication**: NextAuth.js for user authentication

### Deployment Architecture

- **Frontend Hosting**: Next.js application deployment
- **CI/CD**: GitHub Actions workflows for automated testing and deployment
- **Environments**: Separate production and staging environments

### Key Patterns and Conventions

1. **API Routes**: Proxy requests to RoboSystems API with proper authentication
2. **Error Handling**: Consistent error responses with appropriate HTTP status codes
3. **Authentication**: OAuth-based authentication using NextAuth
4. **Data Fetching**: All data fetched from RoboSystems API
5. **Type Safety**: Strict TypeScript with defined types in `/src/types/`
6. **Testing**: Component tests with React Testing Library, API integration tests with Vitest

### Environment Variables

The application requires several environment variables:

- **Authentication**: NextAuth secret and OAuth credentials
- **API Configuration**: RoboSystems API URL and authentication tokens
- **OAuth Providers**: QuickBooks OAuth credentials
- **Environment-specific**: Production/staging URLs

### Integration Points

- **RoboSystems API**: Primary backend service handling all business logic, data processing, and integrations
- **QuickBooks**: OAuth authentication for user accounts
- **NextAuth.js**: Authentication provider integration

### CI/CD Pipeline

1. **Test Phase**: Vitest unit tests, TypeScript checking, ESLint
2. **Build Phase**: Next.js production build
3. **Deploy Phase**: Deploy to hosting platform
4. **Environments**:
   - `main` branch → production (www.roboledger.ai)
   - `staging` branch → staging (staging.roboledger.ai)

### Security Architecture

- **Authentication**: OAuth-based authentication with NextAuth.js
- **API Security**: JWT tokens for RoboSystems API communication
- **SSL/TLS**: HTTPS encryption for all communications
- **Token Management**: Secure handling of authentication tokens

## Important Deployment Instructions

- All deployments should go through the CI/CD pipeline via GitHub Actions
- Use `gh workflow run` or push to appropriate branches for deployments

## Core Library (Git Subtree)

The `/src/lib/core/` directory is a shared library maintained as a git subtree across all RoboSystems frontend apps (robosystems-app, roboledger-app, roboinvestor-app).

### Subtree Commands

```bash
npm run core:pull        # Pull latest changes from core repository
npm run core:push        # Push local core changes back to repository
npm run core:add         # Initial setup (only needed once)
```

### Important Guidelines

- **Pull before making changes**: Always run `npm run core:pull` before modifying core components
- **Test locally first**: Verify changes work in this app before pushing to core
- **Push changes back**: After testing, use `npm run core:push` to share improvements
- **Sync other apps**: After pushing, other apps need to run `core:pull` to get updates
- **Avoid conflicts**: Coordinate with team when making significant core changes

### What's in Core

- **auth-components/**: Login, register, password reset forms
- **auth-core/**: Session management and JWT handling
- **components/**: Graph creation wizard and shared components
- **ui-components/**: Layout, forms, settings components
- **contexts/**: User, company, graph, credit contexts
- **task-monitoring/**: SSE-based background job tracking
- **hooks/**: Shared React hooks
- **theme/**: Flowbite theme customization
