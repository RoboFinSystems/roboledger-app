---
description: Review a pull request — gather metadata, diff, and existing feedback, then give a verdict.
argument-hint: '[pr-number-or-url]'
---

Review a pull request by gathering all PR metadata, diff, and review comments, then provide a comprehensive review summary.

## Instructions

### 1. Identify the PR

The user may provide a PR URL, number, or nothing:

- **URL provided** (e.g., `https://github.com/RoboFinSystems/roboledger-app/pull/175`): Extract the repo and PR number
- **Number provided** (e.g., `175`): Use the current repository
- **Nothing provided**: Detect from the current branch using `gh pr view --json number,url` — if no open PR exists for the current branch, ask the user which PR to review

### 2. Gather PR Data

Run these `gh` commands to collect all context:

```bash
# PR metadata + conversation comments in one call
gh pr view <NUMBER> --json number,url,title,body,author,state,isDraft,labels,comments,reviews,reviewDecision,latestReviews,reviewRequests,statusCheckRollup,mergeStateStatus,headRefName,headRefOid,baseRefName,additions,deletions,changedFiles,files,closingIssuesReferences,createdAt,updatedAt

# PR diff (the actual code changes)
gh pr diff <NUMBER>

# Inline review comments — no --json equivalent exists, so this call is still required
gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner)/pulls/<NUMBER>/comments --paginate
```

**Field notes:**

- `reviews` not `reviewers` — `reviewers` is not a valid field and errors.
- `reviewDecision` is the single field that answers "has this been approved."
- `comments` covers the top-level conversation, so no separate `issues/<n>/comments` call is needed.
- `closingIssuesReferences` gives the linked issue (needed for step 5's requirements check); `files` gives per-file add/delete counts (needed for triaging a large diff); `headRefOid` is the HEAD SHA.
- Keep `--paginate` **bare**. Adding `-q`/`--jq` makes gh emit one JSON document _per page_ instead of a merged array, and `--slurp` can't be combined with `--jq`. Pipe to `jq` after the call, not through it.

### 3. Categorize Review Feedback

Organize all comments and checks into categories:

- **Human Reviews**: Comments from human reviewers (approve, request changes, general feedback)
- **AI Reviews**: Comments from Claude, Copilot, or other AI review bots
- **Code Quality**: Comments from linters, formatters, type checkers
- **Security**: Findings from security scanners (Dependabot, CodeQL, Trivy)
- **CI/CD**: Build status, test results, deployment checks

**How feedback actually arrives in this repo** — don't read the categories too literally:

- Formal `reviews` and inline `pulls/<n>/comments` are typically **empty**, and `reviewDecision` is usually blank. That's the norm here, not a signal that review was skipped. Don't report "no review feedback" on the strength of an empty `reviews` array.
- **AI review is opt-in.** `claude.yml` only fires on an explicit `@claude` mention from an `OWNER`/`MEMBER`/`COLLABORATOR` — there is no automatic review on PR open. When it has run, the findings are a **bot comment in the conversation `comments`**, not a formal review. Absence of AI feedback usually means nobody asked.
- CI is the `test.yml` reusable workflow (vitest → typecheck → lint → format:check → **`npm run build`** → cfn-lint → Trivy). A green suite with a red build is the common shape — the build step catches what the gate does not.
- In `statusCheckRollup`, checks expose `.name` while legacy statuses expose `.context`, and a `conclusion` of `NEUTRAL` or `SKIPPED` is not a failure. Read the conclusion, don't pattern-match on non-`SUCCESS`.

### 4. Review the Diff

With the full PR diff in hand, perform your own review focusing on:

- **Correctness**: Does the code do what the PR description says?
- **Patterns**: Does it follow existing codebase patterns (check `CLAUDE.md`)?
- **Right repo**: Is this app-local code, or a patch over something that belongs in `@robosystems/core` or `@robosystems/report-components`? A fix applied here to a shared component gets overwritten by the next version bump — that's a blocking issue, not a nit. Same for accounting behavior that belongs in the RoboSystems API rather than in the presentation layer.
- **Accounting correctness**: does anything change a displayed figure — statement lines, totals, sign conventions, period boundaries, currency or precision handling? Those need explicit scrutiny and a test; a rendering change that silently alters a number is the worst failure mode this app has.
- **Client/server boundary** (Next.js 16, App Router): is `'use client'` applied at the right level, and does anything server-only leak into a client component? Note that middleware is `src/proxy.ts` in this version — not `src/middleware.ts`. Route groups carry the auth assumption: `(app)` is authenticated, `(landing)` is public.
- **Secret exposure**: `NEXT_PUBLIC_*` values are baked into the client bundle at build time and are public forever. Any secret that gained a `NEXT_PUBLIC_` prefix is a blocking finding. Conversely, a server-only variable read from a client component is a bug.
- **API routes** (`src/app/api/`): the public-facing ones (`contact`, `support`) carry rate limiting (`src/lib/rate-limiter.ts`), Turnstile verification (`src/lib/turnstile-server.ts`), and client-IP derivation (`src/lib/client-ip.ts`). A new public endpoint that skips those is a gap; a change to IP derivation deserves close reading, since it's what rate limiting keys on. `reports/holon` validates JSON-LD for report rendering — treat its input as untrusted.
- **Auth**: is session validation actually enforced for the surface being added, or only visually hidden?
- **Security**: any OWASP top 10 concerns — XSS via `dangerouslySetInnerHTML`, unvalidated redirects, injection into `fetch` URLs?
- **UI consistency**: Flowbite components and existing Tailwind idiom, dark mode on every new surface, and responsive behavior. These regress silently and no test catches them.
- **Accessibility**: labels, keyboard reachability, heading order. `eslint-plugin-jsx-a11y` is configured, so a finding it can't see is the one worth writing down.
- **Error handling**: does a failed API call surface something to the user, or fail silently?
- **Tests**: are changes covered? Read the test, don't trust that it's green — a test that asserts the buggy behavior passes just as happily as a correct one. Check whether new `@robosystems/*` imports need mock coverage in `src/__mocks__/` (missing mocks fail as opaque module-resolution errors, not assertion failures).
- **Disclosure hygiene** (this repo is public): does the PR _text_ over-disclose? A security-fix description should name the area hardened, never the mechanism — no exploit mechanics, attack scenarios, affected-route enumerations, or payloads. Also check sequencing: deploys here are manual, so a merged fix can sit undeployed while the diff describes a live bug. Flag it.
- **Missing changes**: any files that should have been updated but weren't? Common misses: a new env var not added to `.env.example` / `build.yml` / `cloudformation/template.yaml`, a new route missing from `sitemap.ts` or `robots.ts`, a new page without a test.

### 5. Output Format

Provide a structured review:

```
## PR Summary
**Title**: ...
**Author**: ... | **Branch**: ... → ...
**Status**: ... | **Changes**: +X / -Y across Z files

<Brief summary of what the PR does>

## Existing Review Feedback

### Human Reviews
<Summarize human reviewer comments and their status>

### AI Reviews
<Summarize AI review comments — highlight unresolved items>

### Code Quality
<Summarize code quality bot findings>

### Security
<Summarize security scanner findings — flag anything critical>

### CI/CD Status
<Pass/fail status of all checks>

## My Review

### Issues (should fix before merge)
<Numbered list of problems found>

### Suggestions (non-blocking improvements)
<Numbered list of suggestions>

### Questions
<Anything unclear that needs clarification>

## Verdict
<APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION — with brief rationale>
```

### Notes

- If the PR diff is very large (>2000 lines), use the `files` array to triage by churn and note which files were skimmed
- For security findings, always err on the side of flagging — false positives are better than missed vulnerabilities
- Cross-reference the PR description with the actual diff to catch scope creep or missing implementation
- If the PR references an issue (`closingIssuesReferences`), check that the issue requirements are met

$ARGUMENTS
