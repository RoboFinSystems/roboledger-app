---
description: Run the full test and code-quality gate, fixing failures to green.
argument-hint: '[test-file-or-path]'
---

Run `npm run test:all` and systematically fix all failures to achieve 100% completion.

## Timeouts

Always use `timeout: 600000` (10 minutes) on Bash calls for `npm run test:all`. The default 2-minute Bash timeout is too short — prettier walks the whole tree and the full suite regularly takes 3-5 minutes.

## Strategy

1. **Run full suite first**: use the grep pattern below to extract the signal, since prettier prints every file and buries earlier output.
2. **Fix in the order `test:all` runs**: vitest → prettier → eslint → tsc → cfn-lint. The script is a `&&` chain and short-circuits on the first failure, so fix that layer before re-running.
3. **Iterate on the failing layer only** before re-running the full suite (see Key Commands below).
4. **Stop when done**: once `npm run test:all` passes, stop immediately. Do NOT re-run to "confirm."

## What `npm run test:all` actually runs

```
npm run test && npm run format && npm run lint:fix && npm run typecheck && npm run cf-lint
```

Two things follow from that composition:

- **It mutates the working tree.** `format` is `prettier . --write` and `lint:fix` is `eslint . --fix`, so a green run can still leave modified files. Check `git status` afterwards and stage what it rewrote — otherwise the pre-commit hook (which runs check-only variants) fails on the same files.
- **It does not build.** CI (`test.yml`) additionally runs `npm run build`, and build-only failures are real: a Server/Client Component boundary violation or a missing static export passes vitest, typecheck, and lint, then fails the build. If the change touches routing, layouts, `'use client'` boundaries, or config, run `npm run build` too — the gate won't catch it.

`cf-lint` shells out to `uvx cfn-lint`, so it needs `uv` on PATH; a failure there that mentions `uvx` is a tooling problem, not a template problem.

## Output Handling

**CRITICAL: `npm run test:all` runs vitest FIRST, then prettier (which prints ~400 "unchanged" lines), then eslint/tsc/cfn-lint.** With `| tail -N`, you only see the end of the prettier log — the vitest summary scrolls away. Always filter:

```
npm run test:all 2>&1 | grep -E "Test Files|Tests |FAIL|✗|×|error TS|✖|\[E[0-9]|Error:" | tail -30
```

This captures: vitest summary (`Test Files`, `Tests`), failing files/tests (`FAIL`, `✗`, `×`), TypeScript errors (`error TS`), ESLint errors (`✖`), cfn-lint errors (`[E####]`), and generic `Error:` lines. **Success = a `Test Files ... passed` line with no failure markers from any later layer** — a green vitest count alone is not proof the gate passed, since the later layers report in their own formats.

For single-layer commands (below), output is short enough that `| tail -30` alone works.

## Key Commands

**Full suite:**

- `npm run test:all` — tests + format (auto-write) + lint (auto-fix) + typecheck + cfn-lint

**Iteration (one layer at a time):**

- `npx vitest run <path>` — run a single test file (fastest feedback)
- `npm run test` — all vitest tests, no other checks
- `npm run typecheck` — `tsc --noEmit` only
- `npm run lint` — eslint check (no `--fix`)
- `npm run lint:fix` — eslint auto-fix
- `npm run format:check` — prettier check (no write)
- `npm run format` — prettier auto-write
- `npm run cf-lint` — cfn-lint on CloudFormation templates
- `npm run build` — production build; not part of `test:all`, but part of CI

## Notes

- Vitest uses `✓` for pass and `✗`/`×` for fail, plus a `FAIL` prefix for files containing failures.
- The `test` script runs `vitest run --silent` — stack traces on failure are still shown, but per-test pass logs are suppressed.
- **Module-resolution failures after a dependency bump are usually a missing mock, not a broken test.** `vitest.config.ts` aliases the `@robosystems/client*` packages and `react-markdown` to hand-written stubs in `src/__mocks__/`; a component that starts importing a new symbol from one of those packages fails as an opaque import error until the stub gains it. Fix the mock, not the test.
- Shared components come from the `@robosystems/core` and `@robosystems/report-components` npm packages — fixes to them land in their own repos (test there, release, then bump the version here), not in this app. A local patch to a shared component is overwritten by the next bump.
- The pre-commit hook runs the same checks in check-only form (`format:check` → `lint` → `typecheck` → `test` → `cf-lint`) and does not auto-fix, so anything `test:all` silently rewrote must be committed for the hook to pass.

## Goal

100% pass on `npm run test:all` with no errors of any kind. Efficiency matters — don't re-run the full suite until you've fixed all known issues in the current layer.

$ARGUMENTS
