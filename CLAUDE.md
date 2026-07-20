# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**

```bash
npm run dev          # Start development server on PORT 3001
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

- `(app)` route group: Authenticated pages (see Route Inventory below)
- `(landing)` route group: Public pages (login, register, legal pages, landing page)
- API routes follow RESTful patterns with proper session validation

**Route Inventory (consolidated from archived `roboledger-frontend.md` spec):**

| Route                                     | Backend reads                                                       | Status                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/home`                                   | listReports, listTransactions                                       | shipped                                                                                     |
| `/entity` `/entities`                     | getEntity, listEntities                                             | shipped                                                                                     |
| `/connections`                            | listConnections, syncConnection                                     | shipped                                                                                     |
| `/connections/qb-callback`                | oauthCallback                                                       | shipped                                                                                     |
| `/connections/sec/setup`                  | createConnection                                                    | shipped                                                                                     |
| `/ledger/chart-of-accounts`               | getAccountTree, autoMapElements, mapping ops                        | shipped (auto-map UI live; CoA → US-GAAP mapping pending OLTP migration)                    |
| `/ledger/transactions`                    | listTransactions, getTransaction, createJournalEntry (modal)        | shipped (NewJournalEntryModal 2026-05-14)                                                   |
| `/ledger/trial-balance`                   | getTrialBalance, getMappedTrialBalance                              | shipped                                                                                     |
| `/ledger/close`                           | getPeriodCloseStatus, closePeriod, reopenPeriod, listPeriodDrafts   | shipped (also renders schedule/statement/rules blocks via BlockView)                        |
| `/ledger/inbox`                           | listEventBlocks, getEventBlock, previewEventBlock, updateEventBlock | shipped 2026-05-01                                                                          |
| `/agents`                                 | listAgents, getAgent                                                | shipped 2026-05-01                                                                          |
| `/reports` `/reports/new` `/reports/[id]` | listReports, createReport, getReportPackage                         | shipped                                                                                     |
| `/reports/publish-lists`                  | publishList CRUD                                                    | shipped                                                                                     |
| `/library`                                | listLibraryTaxonomies, getLibraryElement                            | shipped                                                                                     |
| `/console`                                | MCP-backed                                                          | shipped                                                                                     |
| `/search`                                 | searchDocuments, listDocuments, getDocumentSection                  | shipped (full-text + semantic document search via core SearchContent)                       |
| `/settings`                               | auth client                                                         | shipped                                                                                     |
| `/plaid-connect`                          | Plaid Link                                                          | scaffold only — not built/specced; medium-term (distinct product surface from the QB layer) |
| `/graphs/new`                             | graph creation                                                      | shipped                                                                                     |

## Frontend Conventions

**Optimistic mutations.** The Inbox `/ledger/inbox` uses optimistic remove via callbacks on approve/reject. The pattern generalizes to other write surfaces (manual JE creation, materialize, future backup/restore) — favor optimistic UI with rollback-on-failure over spinner-and-wait.

**SDK helpers vs raw `gqlQuery`.** Inbox + Agents established the pattern: hand-written `.gql` files + `LedgerClient` methods mirroring `transactions.ts` / `listTransactions`. Continue this pattern for new SDK additions. **Never bump versions** in `package.json` / `pyproject.toml` — version bumps are owned by the user on publish.

**Error mapping.** `friendlyError` helper handles closed-period and element-resolution 422s. Extend the helper as new error classes ship (materialize errors, backup conflicts, outbound-write rejects). Don't surface raw FastAPI 422 detail to users.

**Refresh patterns.** Mutations that change list state use a `refreshKey` bump on the list component (e.g., transactions list after JE submit) rather than full-page reload. SSE operation streams (materialize, long-running ops) use `useOperationMonitoring` from the shared core library.

**Form validation.** Multi-line balanced-entry forms (NewJournalEntryModal) tally running TOTAL DEBIT / TOTAL CREDIT / BALANCE and disable submit unless `BALANCE === 0`. Server-side errors (unbalanced lines, closed period, missing element) surface in a failure Alert without dismissing the form.

**Code colocation.** Route features live under `src/app/(app)/<route>/` with a sibling `components/` (and `__tests__/`) directory — not under a top-level `src/components/<feature>/` tree. `src/components/` holds only cross-route primitives (`PageHeader`, `EntitySelector`, landing/error pages). When adding a new feature, colocate.

**`page.tsx` vs `content.tsx`.** Each route splits into `page.tsx` (Next.js server-boundary entry) that delegates to a client `content.tsx`. Keep the split — don't inline client logic into `page.tsx`.

**BlockView projections.** Statement / schedule / rules views render through `src/app/(app)/ledger/close/components/blockview/` with one file per projection under `projections/` (FactTable, StatementRendering, ScheduleRendering, BusinessRules, ReportElements, VerificationResults). New view modes land as a new projection file + a ViewModeToggle entry, not as a parallel component tree.

**No SWR / React Query.** Data fetching is `useEffect` + `LedgerClient` SDK methods, with `refreshKey` bumps to invalidate. There's no global cache layer and we're not adopting one — don't reach for SWR/TanStack Query when adding a new fetch. If cross-component cache coordination starts hurting, raise it before refactoring.

## Out of Scope (frontend; deferred indefinitely)

The following are explicitly **not** planned for the frontend. Each has been considered and the decision is "no" until concrete customer signal demands otherwise:

- **Real-time event push** (WebSockets / SSE for inbox refresh) — polling on tab focus is enough.
- **Mobile-responsive layouts** beyond what flowbite-react gives for free. Desktop-first product; mobile-read-only is sufficient for initial customers.
- **Bulk operations** beyond what's already shipped (batch approve in inbox is shipped; batch reassign, batch reclassify are not).
- **Customizable inbox views per user** (saved filters, custom column layouts).
- **Agent edit / manual agent creation** — read-only suffices until customer signal demands more.
- **Draft-edit-then-approve workflow** for inbox events — today's flow is approve as-is or reject. The richer flow is part of `event-driven-ledger.md` §5.10 Event Approval Workflow UX (Package II.C1) and lands when that work activates.

## Deferred Surfaces (small UX items; surface when needed)

These are tracked here so they're not lost; each is small enough that it doesn't warrant a dedicated spec entry. Surface them when a customer asks or when the parent feature evolves:

- **Backup / restore UI** — `POST /v1/graphs/{g}/operations/create-backup` and `restore-backup` exist; no UI. Settings page section showing backups list + create button + restore (with confirm). ~½ day each. Probably admin-only.
- **Auto-map progress UI** — the CoA auto-map operation is async with SSE; the CoA page has the trigger button but no streaming progress display. ~2 hours. Land when the next pass over the CoA page happens.
- **`/console` MCP improvements** — Console works but is sparse. Improvements layer in as the MCP tool catalog grows; not a fixed roadmap.
- **QB connect-modal start-date picker** — three-option picker on first connect (full history / since-date / last 60 days). Backend support exists in `SyncOptionsModal` for post-OAuth resync; deferred because the OAuth callback path hardcodes `full_rebuild=True` and threading the picked option through OAuth state is a Phase 1.5 backend concern. See `quickbooks-adapter.md` §4.1.

For larger forward-work surfaces tracked in proper specs:

- **Event approval workflow UX**: see `event-driven-ledger.md` §5.10.
- **AI-suggested handler review page**: see `event-driven-ledger.md` §5.11.
- **Verification Results panel restructure**: see `financial-viewer.md` §7.12.
- **Drift reconciliation UX** (QB outbound write conflicts): see `quickbooks-adapter.md` §4.3.

**Ledger Sub-Routes:**

- `/ledger/chart-of-accounts` - Chart of accounts with element classification
- `/ledger/transactions` - Journal entries with line item detail
- `/ledger/trial-balance` - Period-based debit/credit totals
- `/ledger/account-mappings` - CoA to US-GAAP taxonomy mapping (deprecated, pending OLTP migration)

**Data Integrations:**

- QuickBooks: OAuth 2.0 via `intuit-oauth` for accounting data sync
- SEC XBRL: CIK-based filing connections with US-GAAP taxonomy data
- Plaid: **not built / not specced** — only scaffolding exists (`plaid` + `react-plaid-link` deps, a `/plaid-connect` route, and landing-page copy). Likely medium-term. It's a distinct product surface (direct bank feeds), not just another connection on top of the QuickBooks layer, so it isn't advertised in the README and isn't a shipped integration.

## Key Development Patterns

**Component Organization:**

- Flowbite React components for consistent UI
- Dark mode support via Tailwind CSS
- Responsive design with mobile-first approach
- Component testing with React Testing Library

**App-Specific Libraries:**

- `src/lib/ledger/` - Ledger-specific Cypher queries, types, and US-GAAP element reference
- `src/lib/rate-limiter.ts` - Rate limiting for contact/forms
- `src/lib/sns.ts` - AWS SNS integration
- `src/lib/turnstile-server.ts` - Server-side CAPTCHA validation

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
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` - CAPTCHA configuration
  - Cross-app URLs for SSO navigation between RoboSystems, RoboLedger, and RoboInvestor

## Important Notes

- Requires Node.js 22.x (specified in package.json engines)
- RoboSystems API URL configuration required
- Always run `npm run test:all` before commits
- Format code before submitting PRs

## Core Library (npm Package)

Shared components are consumed from the [`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core) npm package (repo: `RoboFinSystems/robosystems-core`), shared across all RoboSystems frontend apps (robosystems-app, roboledger-app, roboinvestor-app). Import from `@robosystems/core` or its subpaths (e.g. `@robosystems/core/ui-components`).

### Working with Core

- **Core changes happen in the robosystems-core repo**, not here: branch there, test with `npm run test:all`, and validate in this app with a local tarball (`npm run pack:local` in core, then `npm install ../robosystems-core/robosystems-core-<version>.tgz` here) before releasing
- **Releases**: core publishes to npm via its `create-release` workflow; adopt a new version here with `npm install @robosystems/core@<version>`
- **Version pinning**: this app pins a semver range in package.json — core changes land here deliberately via a version bump, not implicitly
- **App wiring**: the package is in the Tailwind `content` globs (`node_modules/@robosystems/core/**/*.js`) and inlined in vitest (`test.server.deps.inline`) — keep both if configs are reworked

### What's in Core

- **auth-components/**: Login, register, password reset forms
- **auth-core/**: Session management and JWT handling
- **components/**: Graph creation wizard and shared components
- **ui-components/**: Layout, forms, chat, and settings components
- **contexts/**: Graph, organization, entity, service-offerings, and sidebar contexts
- **task-monitoring/**: SSE-based background job tracking
- **hooks/**: Shared React hooks
- **theme/**: Flowbite theme customization
