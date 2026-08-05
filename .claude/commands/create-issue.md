---
description: Create a GitHub issue from the repo's templates, with the right type and labels.
argument-hint: '[what the issue is about]'
---

Create a GitHub issue for the current repository based on the user's input.

## Instructions

1. **Check you're in the right repo first** - This app consumes shared UI from the [`@robosystems/core`](https://www.npmjs.com/package/@robosystems/core) and `@robosystems/report-components` npm packages, and talks to the RoboSystems API. Before filing here, decide where the work actually lands:
   - A bug in a shared component (layout, forms, chat, auth forms, graph wizard, contexts, task monitoring) belongs in `RoboFinSystems/robosystems-core` — fixing it here would be patched over on the next version bump.
   - A bug in how a financial statement _renders_ generally belongs in `@robosystems/report-components`; a bug in the numbers themselves belongs in the API.
   - A bug in API behavior, accounting data, the extensions GraphQL surface, or an endpoint contract belongs in `RoboFinSystems/robosystems`.
   - What belongs here: pages and routes under `src/app/`, app-local components, `src/lib/` (including `src/lib/ledger/`), the API routes in `src/app/api/`, CloudFormation, and the workflows.

   If it's cross-repo (an app change blocked on an API or core change), file it here and link the other issue rather than splitting the description.

2. **Determine Issue Type** - Based on the user's description, pick one:
   - **Bug**: Defects or unexpected behavior
   - **Task**: Specific, bounded work items that can be completed in one PR
   - **Feature**: Request a new capability (no design required)
   - **RFC**: Propose a design for discussion before implementation
   - **Spec**: Approved implementation plan ready for execution

   Confirm what this repo actually offers before assuming — `ls .github/ISSUE_TEMPLATE/` for the templates and `gh issue create --help` for whether `--type` is supported.

3. **Gather Context** - If the user provides a file path or references existing code:
   - Read the relevant files to understand the current implementation
   - Check related configuration files
   - Review any referenced documentation

4. **Draft the Issue** - Read the matching YAML template in `.github/ISSUE_TEMPLATE/` and mirror its structure. Each template declares its own `type:` in frontmatter and marks which fields are required — read the file rather than guessing the sections. Fill the optional fields too where you have the information; they're the ones that make an issue actionable later.

   Note `gh issue create --title/--body` **bypasses templates entirely** — nothing prefills and nothing validates. That's exactly why the body has to be hand-matched to the template structure.

   For a UI bug, the reproduction should name the route (e.g. `/reports`, `/ledger`, `/connections`), the viewport if it's responsive-specific, and the color scheme if it's dark-mode-specific. Those three are the details most often missing and most often the whole bug.

   For a **numbers** bug — a statement that doesn't foot, a balance that disagrees with the source ledger — say which statement, which period, and what the expected value was. Without those, the issue isn't reproducible, and "the report is wrong" is the single least actionable bug report this repo receives.

5. **Sanitize for Public Visibility** - This repo is public and the issue is world-readable immediately. Before creating:
   - Remove any internal pricing, margins, or cost details
   - Remove specific customer names, graph IDs, or account data. This app displays real books, so screenshots are the usual leak — check them for entity names, account balances, transaction detail, session tokens, API keys, and email addresses. Redact or reconstruct with dummy figures rather than blurring.
   - Generalize any sensitive business metrics
   - For anything security-adjacent, keep the text terse and non-actionable — no exploit mechanics, no affected-route enumerations, no payloads. Detailed root-cause belongs in private notes, referenced by filename only; for coordinated disclosure use a private GitHub Security Advisory, never a public issue.
   - Keep ordinary technical implementation details (these are fine to share)

6. **Create the Issue** - One command, with the type set inline:

   ```bash
   gh issue create \
     --type <Bug|Task|Feature|RFC|Spec> \
     --title "<clear, concise title>" \
     --body-file /tmp/issue-body.md \
     --label "<labels>"
   ```

   No prefixes like `[SPEC]` in the title — the type handles categorization. Write the body to a file rather than inlining it, to avoid shell-escaping problems.

   To change the type on an **existing** issue: `gh issue edit <n> --type <Type>` (or `--remove-type`).

## Labels

Issue types handle primary categorization; labels carry the metadata. Always enumerate what actually exists rather than working from memory — and raise the limit, since the default truncates at 30:

```bash
gh label list --limit 100
```

The families to expect in this repo:

- **`area:*`** — the primary routing dimension. This repo's set is frontend-shaped and finer-grained than the service repo's: `components`, `pages`, `api` (the Next API routes and server actions, not the RoboSystems API), `auth`, `styling`, `a11y`, `ux`, `mobile`, `performance`, `testing`, `ci-cd`, `infra`. **Always apply one.** This is the most commonly forgotten label and the most useful.
- **`priority:*`** — when to do it. Note the ladder is `critical` / `high` / `low` — there is **no `priority:medium`**.
- **`size:*`** — rough effort: `small` (< 1 day), `medium` (1–3 days), `large` (> 3 days).
- **Status** — `blocked`, `needs-review`.

The stock GitHub labels (`bug`, `enhancement`, `documentation`, `question`, …) still exist but are redundant with issue types — prefer the type plus an `area:*`.

## Questions vs issues

`.github/ISSUE_TEMPLATE/config.yml` disables blank issues and routes open-ended questions to the org's GitHub Discussions. `gh issue create` bypasses that chooser entirely, so apply the intent yourself: if the user's input is a question or a discussion starter rather than actionable work, say so and suggest a Discussion instead of filing it.

## Example Usage

User: "The balance sheet header overlaps the totals on mobile"

Response: Let me check where that component lives first...

[Grep for the component — if it resolves into `@robosystems/report-components` or `@robosystems/core`, say so and file in that repo instead]
[Read bug.yml and draft a body matching its structure, naming the route and viewport]
[Create with `gh issue create --type Bug --label area:mobile,size:small`]

## Output Format

After creating the issue, provide:

1. The issue URL
2. Brief summary of what was created
3. Issue type and labels applied
4. Any suggested follow-up tasks or related issues to create

$ARGUMENTS
