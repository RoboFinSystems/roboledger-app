---
description: Draft curated release notes for a milestone release.
argument-hint: '[version]'
---

Draft curated release notes for an upcoming milestone release, following the convention in `.github/release-notes/README.md`.

## Why this command exists

`tag-release.yml` generates release bodies from the changes since the last tag. That suits routine releases but reads poorly for milestones, where the story is what the version _is_. The curated-notes override has non-obvious rules (body-only format, the file must exist at the tagged ref), and release notes are the repo's most-read public text — this command encodes the review and hygiene checks that keep them accurate and safe to publish.

## Instructions

### 1. Decide whether to curate at all

Not every release deserves curated notes. Routine patch releases should keep the generated changelog — skipping is a normal outcome, not a failure. Curate when the release is a milestone: a minor, a headline capability, or a version the documentation will reference. If the user invoked this command for a plain patch, say so and confirm they still want curated notes.

### 2. Establish the version and the range

- The target version comes from the argument (e.g. `/release-notes 1.1.0`). If none was given, ask what version the user intends to tag — the filename must match the eventual tag exactly, and a mismatched file is silently ignored. Derive it from the current `package.json` version plus the bump type the user will dispatch (`1.0.0` + `minor` → `1.1.0`).
- **Never bump the version yourself.** `create-release.yml` bumps `package.json` on `main` as its first step and derives the tag from the result — a hand-bump collides with it.
- **The range depends on the release kind.** A minor memorializes the whole series since the _previous minor_ (`vX.(Y-1).0..origin/main`) — patches got generated changelogs; the minor is the digest nobody gets from reading thirty of them. A curated patch or hotfix covers only the span since the last tag:

```bash
LAST=$(git tag --sort=-creatordate | head -1)          # patch: last tag
# minor: previous minor tag, e.g. v1.0.0 when cutting v1.1.0
git log "$RANGE_START"..origin/main --merges --format='%s'
gh pr list --state merged --limit 30 --json number,title,mergedAt
```

Note the generated links section will still compare against the last tag; the prose should state the span it covers (e.g. "since v1.0.0") explicitly.

### 3. Review the changes for real

Do not write notes from commit subjects alone. Read the PR bodies (`gh pr view <n>`) and spot-check diffs where the description is thin. For a series-scale minor, group the merge subjects into themes first, then read the bodies of the load-bearing PRs per theme rather than all of them. Classify everything into features, fixes, infrastructure, and chores, then check specifically:

- **Backend dependency.** RoboLedger is a client of the RoboSystems API — the extensions GraphQL surface and the roboledger operations endpoints. If the release needs API behavior that only exists in a newer service version, the notes must say so; deploy order matters (API first, then app). Never describe a capability the deployed API doesn't yet serve.
- **SDK and component bumps.** `@robosystems/client` / `@robosystems/client-extensions` are consumed directly at call sites, so a client major lands as real code changes here. A `@robosystems/report-components` bump changes how statements render and is user-visible — worth a line. A lockfile-only refresh is not.
- **CloudFormation changes.** Edits to `cloudformation/template.yaml` or `cloudformation/s3.yaml` mean a stack update rides the deploy — note which stack.
- **Config surface.** New GitHub Actions variables or environment variables need `npm run setup:gha` before the deploy, not after. Call that out.
- **Accounting-visible behavior.** Changes to close, chart-of-accounts, statement rendering, or anything that alters numbers a bookkeeper sees deserve their own line and precise wording. Users reconcile against these.

### 4. Security disclosure review

This repo is public, and release publication is decoupled from deployment — the notes are world-readable immediately. For any security-adjacent change:

- Keep the line at PR-title neutrality: what area was hardened, never how or against what.
- No exploit mechanics, no affected-route enumerations, no detection signatures or thresholds, no "previously protected only by X" tells.
- Never paste content from private analysis documents into the notes.
- When in doubt, terser.

### 5. Write the file

Write `.github/release-notes/v<version>.md` — **body only**:

- No `# RoboLedger App v<version>` heading, no release-statistics section, no links section, no generated-with footer. The workflow supplies all of those. Start at the first line of prose.
- `v1.0.0.md` is the one prior use of this mechanism and is a good model for the format.
- Lead with one or two sentences saying what the version is. Then sections as warranted: key features, breaking changes (only if any truly exist), bug fixes, infrastructure. Ground every line in a change you actually reviewed.

### 6. Hand off — sequencing matters

The file must exist **at the tagged ref**, and there is no window to add it late: `create-release.yml` bumps the version on `main`, cuts `release/<version>` from the result, and tags it in the same run. So the notes have to be **merged into `main` before the workflow is dispatched** — a file added to the release branch afterwards is already too late.

Write the draft on a feature branch (created via `npm run feature:create`), never on `main`. Present it for review and leave the merge and the dispatch to the user.
