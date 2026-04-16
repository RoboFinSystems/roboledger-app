# RoboSystems Core Components

A shared library of React components, hooks, utilities, and types used across RoboSystems ecosystem applications.

## Overview

This repository contains reusable components shared between:

- **robosystems-app** — Graph database management interface
- **roboledger-app** — Accounting and bookkeeping interface
- **roboinvestor-app** — Investment management interface

## Structure

```
├── actions/                  # Next.js Server Actions
│   ├── entity-actions.ts     # Entity creation and management
│   └── graph-actions.ts      # Graph creation and lifecycle
├── auth-components/          # Authentication UI components
│   ├── AppSwitcher.tsx       # Cross-app navigation switcher
│   ├── AuthGuard.tsx         # Route protection wrapper
│   ├── AuthProvider.tsx      # Authentication context provider
│   ├── SessionWarningDialog.tsx  # Session expiry warning
│   ├── SignInForm.tsx        # Login form
│   ├── SignUpForm.tsx        # Registration form
│   └── TurnstileWidget.tsx   # Cloudflare Turnstile CAPTCHA
├── auth-core/                # Authentication logic and types
│   ├── cleanup.ts            # Session cleanup utilities
│   ├── client.ts             # Authentication client
│   ├── config.ts             # Auth configuration
│   ├── hooks.ts              # useAuth and related hooks
│   ├── sso.ts                # SSO/OAuth support
│   ├── token-storage.ts      # JWT storage utilities
│   └── types.ts              # Auth TypeScript types
├── components/               # Shared UI components
│   ├── console/              # Terminal-style output display
│   ├── repositories/         # Repository browsing and subscriptions
│   ├── search/               # Search UI
│   ├── EntitySelector.tsx    # Entity picker component
│   ├── GraphSelectorCore.tsx # Graph picker component
│   ├── PageLayout.tsx        # Standard page layout
│   └── RepositoryGuard.tsx   # Repository access protection
├── contexts/                 # React contexts
│   ├── entity-context.tsx    # Active entity state
│   ├── graph-context.tsx     # Active graph state
│   ├── org-context.tsx       # Organization state
│   ├── service-offerings-context.tsx  # Available plans and tiers
│   └── sidebar-context.tsx   # Sidebar collapsed/expanded state
├── hooks/                    # Custom React hooks
│   ├── use-api-error.ts      # API error normalization
│   ├── use-media-query.ts    # Responsive breakpoint detection
│   ├── use-streaming-query.ts  # SSE streaming data hook
│   ├── use-toast.tsx         # Toast notification hook
│   ├── use-user-limits.ts    # User quota and limit checks
│   └── use-user.ts           # Current user data hook
├── lib/                      # Utility libraries
│   ├── entity-cookie.ts      # Entity selection persistence
│   ├── graph-cookie.ts       # Graph selection persistence
│   ├── graph-tiers.ts        # Tier display helpers
│   └── sidebar-cookie.ts     # Sidebar state persistence
├── task-monitoring/          # Background job and operation tracking
│   ├── hooks.ts              # useTaskMonitoring, useEntityCreationTask
│   ├── operationErrors.ts    # Operation error types
│   ├── operationHooks.ts     # useOperationMonitoring, useGraphCreation
│   ├── operationMonitor.ts   # SSE-based operation monitor
│   ├── operationTypes.ts     # Shared operation types
│   ├── taskMonitor.ts        # Polling-based task monitor (fallback)
│   └── types.ts              # Task and operation TypeScript types
├── theme/                    # UI theming
│   └── flowbite-theme.ts     # Flowbite React custom theme
├── types/                    # Shared TypeScript definitions
│   ├── entity.d.ts           # Entity type definitions
│   └── user.d.ts             # User type definitions
├── ui-components/            # Reusable UI components
│   ├── api-keys/             # API key management
│   ├── chat/                 # Chat UI (header, input, messages, deep research toggle)
│   ├── forms/                # Form components and validation
│   ├── layout/               # Navbar, sidebar, page containers
│   ├── settings/             # Settings page components
│   ├── support/              # Support modal
│   ├── Logo.tsx              # RoboSystems logo component
│   └── Spinner.tsx           # Loading spinner
└── utils/                    # Utility functions
    └── turnstile-config.ts   # Cloudflare Turnstile configuration
```

## Technology Stack

- **React 18** with modern hooks and patterns
- **TypeScript** for type safety
- **Flowbite React** for UI components
- **Tailwind CSS** for styling
- **Next.js 15** App Router compatibility
- **Auto-generated SDK** from OpenAPI specifications

## Usage as Git Subtree

Each consuming app has npm scripts for subtree management:

```bash
npm run core:pull        # Pull latest changes from core repository
npm run core:push        # Push local core changes back to repository
npm run core:add         # Initial setup (only needed once)
```

### Workflow

1. **Before making changes**: `npm run core:pull` to get latest
2. **Make and test changes** in your app
3. **Push back**: `npm run core:push` to share with other apps
4. **Sync other apps**: Run `npm run core:pull` in each other app

### Manual Commands

```bash
# Pull updates
git subtree pull --prefix=src/lib/core \
  https://github.com/RoboFinSystems/robosystems-core.git main --squash

# Push changes
git subtree push --prefix=src/lib/core \
  https://github.com/RoboFinSystems/robosystems-core.git main
```

## Key Patterns

### Task Monitoring

Two monitors handle async operations:

- **`operationMonitor`** — SSE-based, used for graph lifecycle ops (create, materialize, etc.) that return `OperationEnvelope` with an `operationId`
- **`taskMonitor`** — Polling-based fallback for older task-style operations

```typescript
import { useOperationMonitoring, useGraphCreation } from '@/lib/core/task-monitoring'

// Monitor a graph operation via SSE
const { startMonitoring, progress, result } = useOperationMonitoring()
await startMonitoring(operationId)

// Full graph creation with monitoring
const { createGraph, isCreating } = useGraphCreation()
await createGraph({ graph_type: 'entity', graph_name: 'Acme Corp', ... })
```

### Contexts

```typescript
import { useGraphContext, useOrgContext } from '@/lib/core/contexts'

function MyComponent() {
  const { currentGraphId, setCurrentGraphId } = useGraphContext()
  const { org } = useOrgContext()
}
```

### Authentication

```typescript
import { useAuth, AuthProvider, AuthGuard } from '@/lib/core/auth-core'
import { SignInForm, SignUpForm } from '@/lib/core/auth-components'
```

## Development Guidelines

### Adding New Components

1. Create component in the appropriate directory
2. Add TypeScript types in `types/` if needed
3. Export from the directory's `index.ts`
4. Test in one app before pushing to core

### Naming Conventions

- **Components**: PascalCase (`SidebarProvider`)
- **Hooks**: camelCase with `use` prefix (`useMediaQuery`)
- **Types**: PascalCase (`SidebarCookie`)
- **Utilities**: camelCase (`sidebarCookie`)

## Testing

Tests live in `__tests__/` directories alongside the source files. Run tests in the consuming application:

```bash
npm run test
```

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Follow authentication best practices
- Validate all inputs and API responses
