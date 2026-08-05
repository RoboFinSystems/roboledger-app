---
description: Review the staged diff against this app's frontend, API-route, and deploy conventions.
---

Review all staged changes (`git diff --cached`) with focus on the contexts below. Read the diff first — if nothing is staged, say so rather than reviewing the working tree.

This is a Next.js 16 App Router frontend (React 19, Tailwind v4, Flowbite) that is a client of the RoboSystems API. It is a **public repository**, so anything staged here becomes world-readable on push.

## Before anything else: is this the right repo?

Shared UI comes from the `@robosystems/core` and `@robosystems/report-components` npm packages. A staged edit that patches around one of those components' behavior — rather than composing it — will be overwritten by the next version bump. Flag it and point the fix upstream. The same goes for accounting logic that belongs in the RoboSystems API rather than the presentation layer.

`src/lib/` and `src/app/api/` are **per-app copies** shared by name with robosystems-app and roboinvestor-app, not by package. A fix to `rate-limiter.ts`, `client-ip.ts`, `turnstile-server.ts`, or `sns.ts` here probably needs hand-porting to the sibling apps — note it in the review. `src/lib/ledger/` is RoboLedger's own and has no sibling.

## Application context (`src/app/`, `src/components/`, `src/lib/`)

**Accounting correctness (read this before the style points):**

- Does anything change a displayed figure — statement lines, totals, sign conventions, period boundaries, currency or precision handling? A presentation change that silently alters a number is this app's worst failure mode, and it needs a test, not just a reviewer's eye.
- Is money handled without float arithmetic, and are periods and fiscal-year boundaries derived rather than assumed?

**Code quality:**

- Does the code follow existing patterns in the codebase?
- Are components properly typed — no `any` smuggled in to silence `tsc`?
- Is error handling appropriate, and does a failed API call surface something to the user rather than failing silently?

**React & Next.js 16:**

- Are hooks used correctly (dependency arrays, cleanup, no conditional calls)?
- Is `'use client'` applied at the right level — pushed to the leaf that needs it, not hoisted to a layout?
- Does anything server-only (an SDK secret, `process.env` without `NEXT_PUBLIC_`) leak into a client component?
- Route groups carry different assumptions: `(app)` is authenticated, `(landing)` is public. A page added to the wrong group is an auth bug, not a filing mistake.
- Is state at the right level — local vs. the core contexts (graph, organization, entity, sidebar)?

**UI consistency:**

- Flowbite React components used consistently with the rest of the app?
- Tailwind classes follow existing idiom (and the brand tokens, not hardcoded hex)?
- Dark mode handled on every new surface — this regresses silently and no test catches it.
- Responsive behavior checked, not assumed.

**Accessibility:**

- Labels on inputs, keyboard reachability, sane heading order. `eslint-plugin-jsx-a11y` catches the mechanical cases, so the findings worth writing down are the ones it can't see.

**Security:**

- XSS: `dangerouslySetInnerHTML`, unescaped user input, markdown rendered without sanitization.
- Is a new `NEXT_PUBLIC_*` variable actually public-safe? Those are baked into the client bundle at build time and are public permanently.
- Is authentication enforced for new protected surfaces, or only visually hidden?
- Is sensitive data (tokens, full API payloads) logged or exposed to the client unnecessarily?

## API routes (`src/app/api/`)

Five routes exist: `contact`, `support`, `reports/holon`, `session/sidebar`, `utilities/health`. For changes here:

- The public form endpoints (`contact`, `support`) are protected by rate limiting (`src/lib/rate-limiter.ts`), Turnstile verification (`src/lib/turnstile-server.ts`), and client-IP derivation (`src/lib/client-ip.ts`). A new public endpoint that skips them is a gap.
- `reports/holon` validates JSON-LD used to render reports. Treat its input as untrusted — validation gaps here surface as malformed statements, and anything that ends up in the DOM is an XSS path.
- Changes to client-IP derivation deserve close reading: rate limiting keys on it, and the trust model is CloudFront's `CloudFront-Viewer-Address` header first, with `TRUSTED_PROXY_HOPS` as the fallback for requests that didn't arrive through CloudFront. Widening that trust is a spoofing vector.
- Is input validated before it reaches SNS or the RoboSystems client?
- Are errors returned with appropriate status codes, and without echoing internals?

## Proxy / security headers (`src/proxy.ts`)

This is the Next 16 middleware file (renamed from `middleware.ts`) and here it does **security headers and CSP**, not auth. So:

- A CSP directive added to allow a new script/style/image source is a real security decision — is the source necessary, and is it the narrowest host that works?
- Watch the dev-vs-prod branches: `'unsafe-eval'` is dev-only by design. Anything that moves a relaxation into the production branch is a blocking finding.
- Check the `matcher` if paths were added — it excludes `api`, `_next/*`, and static assets on purpose.

## Testing (`src/**/__tests__/`)

- Do new components have corresponding tests?
- Are React Testing Library patterns used correctly (query by role/label, not implementation details)?
- Does a new `@robosystems/*` import need mock coverage in `src/__mocks__/`? Missing stubs fail as opaque module-resolution errors, not assertion failures.
- Is coverage maintained on critical paths (auth, connections/OAuth, statement rendering, close)?

## Deployment (`.github/workflows/`, `cloudformation/`)

- A new environment variable has to be threaded end to end: `.env.example` → `build.yml` inputs → the deploy workflow's `vars.*` → `cloudformation/template.yaml`. A gap anywhere means it's simply undefined in production.
- `NEXT_PUBLIC_*` values are baked at **build** time, so changing one requires a redeploy, not a restart.
- Do CloudFormation edits require a stack update, and which stack (`RoboLedgerApp{Staging,Prod}` vs `RoboLedgerAppS3{Staging,Prod}`)?
- Are secrets referenced rather than inlined? Nothing resembling a credential should appear in the diff at all.

## Public-repo hygiene

- No customer names, graph IDs, real account balances, or internal cost/pricing detail in code comments or fixtures. Test fixtures built from real books are the recurring offender here — figures should be invented, not borrowed.
- If the change fixes a security issue, keep commit messages and comments terse and non-actionable — the area hardened, never the mechanism. Deploys here are manual, so a pushed fix can describe a still-live bug.

## Output

Provide a summary with:

1. **Issues**: Problems that should be fixed before commit
2. **Suggestions**: Improvements that aren't blocking
3. **Questions**: Anything unclear that needs clarification

Anchor each finding to `file:line`. If the staged diff is clean, say so plainly rather than manufacturing findings.
