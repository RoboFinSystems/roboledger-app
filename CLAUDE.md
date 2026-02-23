# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**

```bash
npm run dev          # Start development server on PORT 3000
npm run build        # Production build
npm run start        # Production start
```

**Code Quality:**

```bash
npm run test:all     # All tests, formatting, linting, type checking, and CF linting
npm run test         # Run Vitest test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Architecture Overview

**Authentication System:**

- RoboSystems Client SDK for user authentication and session management
- Cookie-based session persistence with automatic refresh
- Pre-built login/register forms via shared core library
- Session validation across authenticated routes

**API Routes:**

- `/api/utilities/health` - Health check endpoint for App Runner
- `/api/contact` - Contact form submission via SNS (with rate limiting and CAPTCHA)
- `/api/session/sidebar` - Sidebar state management

**Route Structure:**

- `(app)` route group: Authenticated pages (home, console, graphs, schema, tables, subgraphs, backups, repositories, billing, usage, organization, settings, dashboard, checkout)
- `(landing)` route group: Public pages (login, register, auth, pricing, platform, open-source, legal pages)
- `(blog)` route group: Blog posts
- API routes follow RESTful patterns with proper session validation

## Key Development Patterns

**Component Organization:**

- Flowbite React components for consistent UI
- Dark mode support via Tailwind CSS
- Responsive design with mobile-first approach
- Component testing with React Testing Library

**API Integration Patterns:**

- All data operations through RoboSystems API endpoints
- API keys system with user/system types
- Company-specific data isolation handled by the API

**Frontend Development:**

- Primarily client-side Next.js 16 application that connects to RoboSystems API
- Session validation on protected routes through API
- RoboSystems Client SDK for all API interactions
- Client-side error handling and user feedback

**Testing Strategy:**

- Vitest with jsdom environment for fast unit and component testing
- Component tests in `__tests__/` directories
- Path alias support for clean imports
- Test coverage reporting available with v8 provider

## Deployment

- Deployed on AWS App Runner behind CloudFront
- Environment variables needed:
  - `NEXT_PUBLIC_ROBOSYSTEMS_API_URL` - RoboSystems API endpoint
  - `SNS_CONTACT_TOPIC_ARN` - SNS topic for contact form
  - `SNS_WAITLIST_TOPIC_ARN` - SNS topic for waitlist
  - `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - CAPTCHA configuration

## Important Notes

- Requires Node.js 22.x (specified in package.json engines)
- RoboSystems API URL configuration required
- Always run `npm run test:all` before commits
- Format code before submitting PRs

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
- **ui-components/**: Layout, forms, chat, and settings components
- **contexts/**: Graph, organization, entity, service-offerings, and sidebar contexts
- **task-monitoring/**: SSE-based background job tracking
- **hooks/**: Shared React hooks
- **theme/**: Flowbite theme customization
