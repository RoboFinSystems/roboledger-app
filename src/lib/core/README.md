# RoboSystems Core Components

A shared library of React components, hooks, utilities, and types used across RoboInvestor ecosystem applications.

## Overview

This repository contains reusable components that are shared between:

- **roboinvestor-app** - Primary investment management interface
- **roboledger-app** - Financial reporting and ledger management
- **robosystems-app** - Core systems management

## Structure

```
├── auth-components/          # Authentication UI components
│   ├── AuthProvider.tsx      # Authentication context provider
│   ├── SignInForm.tsx        # Login form component
│   └── SignUpForm.tsx        # Registration form component
├── auth-core/               # Authentication logic and types
│   ├── client.ts            # Authentication client
│   ├── hooks.ts             # Authentication hooks
│   └── types.ts             # Authentication TypeScript types
├── contexts/                # React contexts
│   └── sidebar-context.tsx  # Sidebar state management
├── hooks/                   # Custom React hooks
│   └── use-media-query.ts   # Media query hook for responsive design
├── lib/                     # Utility libraries
│   └── sidebar-cookie.ts    # Sidebar state persistence
├── theme/                   # UI theming
│   └── flowbite-theme.ts    # Flowbite React custom theme
├── types/                   # Shared TypeScript definitions
│   └── user.d.ts           # User type definitions
├── ui-components/          # Reusable UI components
│   ├── api-keys/           # API key management components
│   ├── forms/              # Form components and validation
│   ├── layout/             # Layout and container components
│   └── settings/           # Settings page components
└── index.ts                # Main export file
```

## Technology Stack

- **React 18** with modern hooks and patterns
- **TypeScript** for type safety
- **Flowbite React** for UI components
- **Tailwind CSS** for styling
- **Next.js 15** App Router compatibility
- **Auto-generated SDK** from OpenAPI specifications

## Usage as Git Subtree

### Initial Setup

Add this repository as a subtree to your app:

```bash
# In your app directory (roboinvestor-app, roboledger-app, etc.)
git subtree add --prefix=src/lib/core \
  https://github.com/yourorg/robosystems-core.git main --squash
```

### Pull Updates

Get the latest common components:

```bash
git subtree pull --prefix=src/lib/core \
  https://github.com/yourorg/robosystems-core.git main --squash
```

### Push Changes

Push your improvements back to the common repository:

```bash
git subtree push --prefix=src/lib/core \
  https://github.com/yourorg/robosystems-core.git main
```

## Component Usage

### Import from Common

```typescript
import {
  useMediaQuery,
  useSidebarContext,
  SidebarProvider,
  customTheme,
  sidebarCookie,
} from '@/lib/common'

import type { CommonUser, SidebarCookie } from '@/lib/common'
```

### Authentication

```typescript
import { useAuth, AuthProvider } from '@/lib/common'

function MyApp() {
  return (
    <AuthProvider>
      <MyComponents />
    </AuthProvider>
  )
}

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  // ... component logic
}
```

### Sidebar Management

```typescript
import { SidebarProvider, useSidebarContext } from '@/lib/common'

function Layout({ children }) {
  return (
    <SidebarProvider initialCollapsed={false}>
      <MySidebar />
      <main>{children}</main>
    </SidebarProvider>
  )
}

function MySidebar() {
  const { desktop, mobile } = useSidebarContext()
  // ... sidebar logic
}
```

### Responsive Design

```typescript
import { useMediaQuery } from '@/lib/common'

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* component content */}
    </div>
  )
}
```

### API Integration

```typescript
import { SDK } from '@/lib/common'
import type { UserResponse } from '@/lib/common/sdk/types.gen'

async function fetchUser() {
  const response = await SDK.getCurrentUser()
  const userData = response.data as UserResponse
  return userData
}
```

## Development Guidelines

### Adding New Components

1. **Create component** in appropriate directory
2. **Add TypeScript types** in `types/` if needed
3. **Export from index.ts** files
4. **Update main index.ts** to include new exports
5. **Test in one app** before pushing to common repo

### Naming Conventions

- **Components**: PascalCase (`SidebarProvider`)
- **Hooks**: camelCase with `use` prefix (`useMediaQuery`)
- **Types**: PascalCase (`SidebarCookie`)
- **Utilities**: camelCase (`sidebarCookie`)

### TypeScript Patterns

- Use `type` for simple types, `interface` for objects
- Prefer runtime type guards over direct assertions
- Export types from `types/` directory
- Use generated SDK types when available

## Testing

Components should be tested in the consuming applications. Common patterns:

```typescript
import { render, screen } from '@testing-library/react'
import { SidebarProvider } from '@/lib/common'

test('sidebar provider works', () => {
  render(
    <SidebarProvider initialCollapsed={false}>
      <TestComponent />
    </SidebarProvider>
  )
  // ... test logic
})
```

## Versioning

This repository follows semantic versioning principles:

- **Major**: Breaking changes to public APIs
- **Minor**: New features, non-breaking changes
- **Patch**: Bug fixes, internal improvements

## Contributing

1. Make changes in your app's `src/lib/core` directory
2. Test thoroughly in your app
3. Push changes back to this repository
4. Update other apps to pull the latest changes
5. Ensure all apps pass their test suites

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Follow authentication best practices
- Validate all inputs and API responses

---

Generated with Claude Code for consistent, reliable shared components across the RoboInvestor ecosystem.
