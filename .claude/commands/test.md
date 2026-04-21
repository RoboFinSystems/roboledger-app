Run `npm run test:all` and systematically fix all failures to achieve 100% completion.

## Timeouts

Always use `timeout: 600000` (10 minutes) on Bash calls for `npm run test:all`. The default 2-minute Bash timeout is too short — prettier walks the whole tree and the full suite regularly takes 3-5 minutes.

## Strategy

1. **Run full suite first**: use the grep pattern below to extract the signal, since prettier prints every file and buries earlier output.
2. **Fix in the order `test:all` runs**: vitest → prettier → eslint → tsc → cfn-lint. The script short-circuits on the first failure, so fix that layer before re-running.
3. **Iterate on the failing layer only** before re-running the full suite (see Key Commands below).
4. **Stop when done**: once `npm run test:all` passes, stop immediately. Do NOT re-run to "confirm."

## Output Handling

**CRITICAL: `npm run test:all` runs vitest FIRST, then prettier (which prints ~400 "unchanged" lines), then eslint/tsc/cfn-lint.** With `| tail -N`, you only see the end of the prettier log — the vitest summary scrolls away. Always filter:

```
npm run test:all 2>&1 | grep -E "Test Files|Tests |FAIL|✗|×|error TS|✖|\[E[0-9]|Error:" | tail -30
```

This captures: vitest summary (`Test Files`, `Tests`), failing files/tests (`FAIL`, `✗`, `×`), TypeScript errors (`error TS`), ESLint errors (`✖`), cfn-lint errors (`[E####]`), and generic `Error:` lines. Absence of any failure markers plus presence of "passed" means success — stop there.

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

## Notes

- Vitest uses `✓` for pass and `✗`/`×` for fail, plus a `FAIL` prefix for files containing failures.
- The `test` script runs `vitest run --silent` — stack traces on failure are still shown, but per-test pass logs are suppressed.
- After editing a component under `src/lib/core/`, the same fix may need to land upstream via `npm run core:push` so other apps pick it up on their next `core:pull`.

## Goal

100% pass on `npm run test:all` with no errors of any kind. Efficiency matters — don't re-run the full suite until you've fixed all known issues in the current layer.
