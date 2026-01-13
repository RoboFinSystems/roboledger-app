# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**

```bash
npm run dev          # Start development server on PORT 3000 with Turbo mode
npm run build        # Production build
npm run start        # Production start
```

**⚠️ Development Port Change**: The development server runs on port **3000**. Update local configurations accordingly.

**Code Quality:**

```bash
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

- RoboSystems Client for user authentication and session management
- All data storage and business logic handled by RoboSystems API
- User-company associations managed through API endpoints

**Authentication Flow:**

- RoboSystems Components SDK with React hooks and components
- Cookie-based session persistence with automatic refresh
- Pre-built login/register forms with custom styling
- Session validation across authenticated routes

**AI Integration:**

- Dual AI system: External RoboSystems agent + Anthropic Claude
- Chat interface at `/api/chat` with session-based conversations
- Agent service integration for specialized business intelligence

**Route Structure:**

- `(app)` route group: Authenticated application pages (home, settings)
- `(landing)` route group: Public pages (login, register, legal pages)
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

- Server actions with proper error handling
- Session validation on protected routes through API
- RoboSystems Client for all API interactions
- Client-side error handling and user feedback

**Testing Strategy:**

- Vitest with jsdom environment for fast unit and component testing
- Component tests in `__tests__/` directories
- Path alias support for clean imports
- Test coverage reporting available with v8 provider

## Deployment

**Frontend Application:**

- Next.js application that connects to RoboSystems API
- Can be deployed to any static hosting service (Vercel, Netlify, etc.)
- Environment variables needed:
  - `NEXT_PUBLIC_ROBOSYSTEMS_API_URL` - RoboSystems API endpoint
  - Any other app-specific configuration

## Important Notes

**Environment Setup:**

- Requires Node.js 22.x (specified in package.json engines)
- Flowbite React requires post-install patching
- RoboSystems API URL configuration required

**Development Workflow:**

- Always run type checking before commits
- Use `npm run dev` for full development setup
- Format code before submitting PRs
- Test coverage should be maintained for new components

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
