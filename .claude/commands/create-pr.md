Create a GitHub pull request for the current branch, writing the title and description from the actual work done in this session — not reconstructed from the diff.

## Why this command exists

The previous flow outsourced PR-description authoring to a GitHub Action that only saw the diff and commit messages. It could not know _why_ the changes were made, so it frequently described things that weren't true. Those inaccurate descriptions then fed `@claude` reviews, compounding the bad information. This command fixes that at the root: **you author the description here, where the full context of what was done and why is available.**

## Instructions

### 1. Preflight

Run these checks before touching anything:

```bash
# Current and target branches
CURRENT=$(git branch --show-current)
TARGET=${1:-main}            # override target via the first argument
```

- **Never PR from the default branch.** If `CURRENT` is `main` (or `master`/`staging`), stop and tell the user to switch to a feature branch first.
- **Source ≠ target.** If `CURRENT == TARGET`, stop.
- **Uncommitted changes.** Run `git status --porcelain`. If there are uncommitted/staged changes, surface them and ask whether to commit them (respecting the repo's commit rules — never on `main`, no `git add -A`) or proceed without them. The PR description must reflect committed state.
- **Existing PR.** Check `gh pr list --head "$CURRENT" --base "$TARGET" --json url,number`. If a PR already exists, do **not** create a duplicate — offer to update its title/body with `gh pr edit` instead.
- **Push the branch.** `gh pr create` requires the branch on the remote. Ensure it's pushed: `git push -u origin "$CURRENT"` (the user invoking `/create-pr` is the explicit, in-the-moment request that authorizes pushing _this feature branch_ — this is the one push allowed without a separate ask; never push `main`).

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

- **Type** — derive from the branch prefix (`feature/` → feat, `bugfix/`/`fix/` → fix, `hotfix/` → fix, `chore/` → chore, `refactor/` → refactor). Default to `feat` if unprefixed.
- **Title** — concise (~50–72 chars), conventional-commit style, e.g. `feat(library): order CoA hierarchy by AccountType`. Match the style in `git log`.
- **Body** — markdown, only sections that apply:
  - **Summary** — 1–3 sentences: what this PR does and why.
  - **Changes** — bullets grouped by area/file, describing real edits.
  - **Testing** — state truthfully what was run. If `npm run test:all` (or a subset) was run this session, say so and give the result. If nothing was run, say "Not run" — never claim passing tests that weren't executed.
  - **Notes / Follow-ups** — optional: deferred items, risks, related issues/specs.
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

Otherwise leave it off — the description is now accurate, and the user can run `/pr-review` locally (full context) or `@claude` manually when ready. Do not request review by default.

## Output

After creating the PR, report:

1. The PR URL.
2. A one-line summary of the title.
3. Target ← source branches.
4. Whether a Claude review was requested.

## Arguments

`$ARGUMENTS` may contain:

- A target branch (default `main`).
- `review` / `--review` to auto-request a `@claude` review.
- Freeform guidance on what to emphasize in the description.

$ARGUMENTS
