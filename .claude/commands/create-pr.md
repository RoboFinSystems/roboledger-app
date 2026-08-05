---
description: Open a pull request for the current branch, writing the description from the work actually done.
argument-hint: '[target-branch] [review]'
---

Create a GitHub pull request for the current branch, writing the title and description from the actual work done in this session — not reconstructed from the diff.

## Why this command exists

The previous flow outsourced PR-description authoring to a GitHub Action that only saw the diff and commit messages. It could not know _why_ the changes were made, so it frequently described things that weren't true. Those inaccurate descriptions then fed `@claude` reviews, compounding the bad information. This command fixes that at the root: **you author the description here, where the full context of what was done and why is available.**

This is a Next.js 16 frontend (React 19, Tailwind v4, Flowbite) that is a **client of the RoboSystems API** and consumes shared UI from the `@robosystems/core` and `@robosystems/report-components` npm packages. Ground every description in the code that actually changed in _this_ repo.

**This repository is public.** The PR title and body are world-readable the moment they're pushed — routinely _before_ the change is deployed, since deploys are manual `workflow_dispatch` runs. Treat the description as a publication, not a work note.

## Instructions

### 1. Preflight

Run these checks before touching anything:

```bash
# Current and target branches
CURRENT=$(git branch --show-current)
TARGET=${1:-main}            # override target via the first argument
```

- **Never PR from the default branch.** If `CURRENT` is `main` (or `master`/`staging`), stop and tell the user to switch to a feature branch first. New branches are created only via `npm run feature:create` (per `CLAUDE.local.md`) — never by hand.
- **Source ≠ target.** If `CURRENT == TARGET`, stop.
- **Uncommitted changes.** Run `git status --porcelain`. If there are uncommitted/staged changes, surface them and ask whether to commit them (respecting the repo's commit rules — never on `main`, stage files by name, no `git add -A`) or proceed without them. The PR description must reflect committed state.
- **Existing PR.** Check `gh pr list --head "$CURRENT" --base "$TARGET" --json url,number`. If a PR already exists, do **not** create a duplicate — offer to update its title/body with `gh pr edit` instead.
- **Security fixes — check deployment first.** A security-fix commit discloses the bug through its diff the moment it's pushed, and this app deploys manually, so the window can be long. If this branch carries one, check whether the vulnerable code is still live (`git show <prod-tag>:<file>` against the fix) and tell the user, so they can sequence the deploy with — or ahead of — the public push.
- **Push the branch.** `gh pr create` requires the branch on the remote. Ensure it's pushed: `git push -u origin "$CURRENT"` (the user invoking `/create-pr` is the explicit, in-the-moment request that authorizes pushing _this feature branch_ — never push `main` or `release/*`; the `.githooks/pre-push` hook blocks those anyway).

### 2. Gather the real change context

This is the whole point — ground the description in what actually happened:

- **Primary source: this session.** Use what was actually changed and why from the conversation context. This is the information the old GHA workflow never had.
- **Corroborate against the branch:**
  ```bash
  git log --oneline "$TARGET".."$CURRENT"     # commits on this branch
  git diff --stat "$TARGET"..."$CURRENT"      # files + churn
  git diff "$TARGET"..."$CURRENT"             # full diff — read it, don't guess
  ```
- **Hard rule — no confabulation.** Every claim in the description must be supported by the diff. If you didn't change UI, don't write "UI improvements." If a behavior isn't in the diff, don't mention it. When the session context and the diff disagree, the diff wins and you investigate the discrepancy.

### 3. Compose the PR

- **Type** — derive from the branch prefix (`feature/` → feat, `bugfix/`/`fix/` → fix, `hotfix/` → fix, `chore/` → chore, `refactor/` → refactor, `release/` → release). Default to `feat` if unprefixed.
- **Title** — concise (~50–72 chars), conventional-commit style, e.g. `feat(library): order CoA hierarchy by AccountType`. Match the style in `git log`.
- **Body** — markdown. **Match the headings in `.github/PULL_REQUEST_TEMPLATE.md`**, because `--body-file` bypasses template prefill entirely and a hand-written body silently drops whatever sections it omits:
  - **Summary** — 1–3 sentences: what this PR does and why.
  - **Changes** — bullets grouped by file or route, describing real edits. Name the user-visible surface (route, page, component) — that's what a reader is looking for in a frontend PR. If the change alters a number a bookkeeper reads — a statement line, a close calculation, a chart-of-accounts ordering — say so explicitly and precisely; users reconcile against these.
  - **Deploy Notes** — "None" if it's a plain code change, and say so explicitly rather than omitting the section. This is where the cross-repo dependencies below go.
  - **Testing** — state truthfully what was run. The repo gate is `npm run test:all` (vitest → prettier → eslint `--fix` → tsc → cfn-lint); the individual layers (`npm run test`, `typecheck`, `lint`, `format:check`, `cf-lint`) can be run standalone, and `npm run build` catches build-only failures the gate does not. If you ran any of these this session, say which and give the result. If nothing was run, say "Not run" — never claim passing tests that weren't executed.

  The template has no Related Issues section — put `Closes #123` / `Fixes #456` as the last line of the Summary. GitHub links it from anywhere in the body.

- **Cross-repo dependencies — these go under Deploy Notes.** Call them out explicitly; they change how the PR gets deployed, not just how it reads:
  - **Backend API.** If the change consumes API behavior that only exists in a newer service version — the extensions GraphQL surface or the roboledger operations endpoints — say so and name the deploy order (API first, then app). Never describe a capability the deployed API doesn't yet serve.
  - **`@robosystems/core` / `@robosystems/report-components`.** Shared components live in their own repos; a version bump here is an adoption, and if it changes call sites, say which. A `report-components` bump changes how statements render and is user-visible — describe the visual change, not just the version. If the PR patches around a package bug locally, note it as temporary and link the upstream issue.
  - **`@robosystems/client`.** Post-1.0 semver; a major bump lands as real code changes here, not a lockfile refresh. Distinguish the two.
  - **CloudFormation.** Edits to `cloudformation/template.yaml` or `cloudformation/s3.yaml` mean a stack update rides the deploy — note which stack.
  - **Config surface.** New `NEXT_PUBLIC_*` values are baked at build time from GitHub Actions variables, so a new one needs `npm run setup:gha` (or a bootstrap re-run) **before** the deploy, not after.

- **Security-fix disclosure.** If the PR fixes a security issue, the prose is often _more_ actionable than the diff — keep it terse and non-actionable. Describe the area hardened, never the mechanism: "harden input validation on the contact endpoint", not the how. **No** exploit mechanics, attack scenarios, affected-route enumerations, payloads/regexes, or "previously protected only by X" tells. Detailed root cause and any PoC stay in private notes, referenced by filename only. For coordinated disclosure use a private GitHub Security Advisory, never a public issue.

- **Attribution** — attribute to the user only. Do **not** add a "🤖 Generated with Claude Code" footer or a `Co-Authored-By: Claude` trailer (per `CLAUDE.local.md`). Include such a line only if the user explicitly asks.

### 4. Create the PR

Write the body to a temp file to avoid shell-escaping problems, then:

```bash
gh pr create \
  --base "$TARGET" \
  --head "$CURRENT" \
  --title "<title>" \
  --body-file /tmp/pr-body.md
```

Print the resulting PR URL.

### 5. Optional Claude review

Only if the user explicitly asks (e.g. passes `review` / `--review` in arguments), request a review:

```bash
gh pr comment <number> --body "@claude please review this PR"
```

`claude.yml` only fires on an `@claude` mention from an `OWNER`/`MEMBER`/`COLLABORATOR`, so nothing happens automatically. Leave it off by default — the description is now accurate, and the user can run `/pr-review` locally (full context) or mention `@claude` when ready.

## Output

After creating the PR, report:

1. The PR URL.
2. A one-line summary of the title.
3. Target ← source branches.
4. Whether a Claude review was requested.
5. Any cross-repo or deploy-ordering dependency you flagged in the body.

## Arguments

`$ARGUMENTS` may contain:

- A target branch (default `main`).
- `review` / `--review` to auto-request a `@claude` review.
- Freeform guidance on what to emphasize in the description.

$ARGUMENTS
