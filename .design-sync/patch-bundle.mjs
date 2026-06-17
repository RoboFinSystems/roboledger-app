// Post-build patch for the design-sync bundle.
//
// WHY (1) — process shim: @robosystems/core components read
// `process.env.NEXT_PUBLIC_*` at module scope (e.g. auth-core/config.ts →
// CURRENT_APP, imported transitively by even leaf components like Spinner). In
// the real app, Next replaces these at build time; the design-sync esbuild
// bundle only defines process.env.NODE_ENV, so every other `process.env.*`
// reference throws `ReferenceError: process is not defined` at render. This
// injects a global `process` shim as line 2 of _ds_bundle.js — line 1 stays the
// `/* @ds-bundle: {...} */` contract header the claude.ai/design self-check
// parses.
//
// WHY (2) — app identity: the brand LOGO components (LogoBadge, AnimatedLogo,
// BrandSpinner) pick their mark + brand color from CURRENT_APP =
// process.env.NEXT_PUBLIC_APP_NAME || 'robosystems'. Without it they default to
// the RoboSystems blue mark on EVERY app. We read the app name from the sibling
// `.design-sync/app-name` file and seed it into the shimmed env so each app's
// project shows its own logo (CSS-driven brand colors are already per-app via
// the compiled stylesheet; this fixes the JS-driven logo brand).
//
// RE-SYNC: package-build.mjs / preview-rebuild.mjs / resync.mjs all overwrite
// _ds_bundle.js, so this MUST be re-run after every build (and the bundle
// re-validated) before upload. See .design-sync/NOTES.md.
//
//   node .design-sync/patch-bundle.mjs [./ds-bundle]
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = process.argv[2] || './ds-bundle'
const file = join(out, '_ds_bundle.js')

// App name from the sibling app-name file (default robosystems).
const scriptDir = dirname(fileURLToPath(import.meta.url))
let appName = 'robosystems'
try {
  const v = readFileSync(join(scriptDir, 'app-name'), 'utf8').trim()
  if (v) appName = v
} catch {
  /* default */
}

const SHIM =
  'globalThis.process=globalThis.process||{};' +
  'globalThis.process.env=globalThis.process.env||{};' +
  `globalThis.process.env.NEXT_PUBLIC_APP_NAME=globalThis.process.env.NEXT_PUBLIC_APP_NAME||${JSON.stringify(appName)};`

function refreshAnchor() {
  const anchorPath = join(out, '_ds_sync.json')
  if (!existsSync(anchorPath)) return
  const sha12 = createHash('sha256')
    .update(readFileSync(file))
    .digest('hex')
    .slice(0, 12)
  const anchor = JSON.parse(readFileSync(anchorPath, 'utf8'))
  if (anchor.bundleSha12 === sha12) return
  anchor.bundleSha12 = sha12
  writeFileSync(anchorPath, JSON.stringify(anchor))
  console.error(`✓ refreshed _ds_sync.json bundleSha12 → ${sha12}`)
}

const src = readFileSync(file, 'utf8')
const nl = src.indexOf('\n')
if (nl === -1 || !src.slice(0, nl).includes('@ds-bundle')) {
  console.error(
    '✗ unexpected bundle layout — first line is not the @ds-bundle header; aborting'
  )
  process.exit(1)
}
// Strip any prior shim line directly after the header (handles re-runs and
// shim-string changes), then insert the current shim as line 2.
const rest = src.slice(nl + 1).replace(/^globalThis\.process=[^\n]*\n/, '')
writeFileSync(file, src.slice(0, nl + 1) + SHIM + '\n' + rest)
console.error(
  `✓ injected process shim (NEXT_PUBLIC_APP_NAME=${appName}) into ${file} (line 2)`
)
refreshAnchor()
