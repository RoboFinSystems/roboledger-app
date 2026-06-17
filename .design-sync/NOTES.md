# design-sync NOTES — @robosystems/core

This repo is a **Next.js app**, not a published component library. The "design system"
is the shared subtree at `src/lib/core/` (`@robosystems/core`), consumed as source —
**no `dist/`, never installed into `node_modules`**. The sync therefore runs the
package shape in **synth-entry mode**. Read this before any re-sync.

## Build setup (how the bundle is produced)

- **Symlink** `node_modules/@robosystems/core -> ../../src/lib/core` so `PKG_DIR`
  resolves (gitignored; mirrors how a monorepo would resolve it). Recreate on a
  fresh clone: `ln -sfn ../../src/lib/core node_modules/@robosystems/core`.
- `cfg.srcDir: "."` → source root IS the package dir. `cfg.tsconfig: "tsconfig.json"`
  (core's own) for esbuild path resolution.
- **No `--entry`** is passed → the converter synthesizes an entry from `src/` and
  discovers components from PascalCase value exports. (Passing `--entry` would set
  `synthEntry=false` and discover ZERO components, since there is no `.d.ts` tree.)
- `--node-modules ./node_modules` (the app's — that's where react/flowbite/SDK resolve).
- `.d.ts` props are **stubs** (`[key:string]: unknown`) in synth mode — the real
  prop shapes live in the component source. Authored previews were written from source.

## CSS (the main lift — Tailwind v4, nothing static ships)

- `.design-sync/compile-css.mjs` (durable) compiles `src/app/globals.css` →
  `src/lib/core/.ds-compiled.css` via the app's own `@tailwindcss/postcss`, scanning
  the config's content globs (cover `src/lib/core`), the previews dir, AND
  `.design-sync/tw-safelist.txt`. Brand tokens come from BOTH `@theme` in globals.css
  AND `theme.extend.colors` in `tailwind.config.ts`. `@font-face` is **stripped** from
  the output (fonts are wired separately — see below).
- **`tw-safelist.txt`** (durable) enumerates the full brand-color palette (primary/
  secondary/accent/gray/amber × every scale × bg/text/border/ring/from/to/via +
  hover/dark/focus) so the static `styles.css` carries the whole palette — designs the
  agent builds receive only that stylesheet, so every brand utility must be pre-generated.
  Layout/spacing utilities are component-usage-driven (broaden the safelist if needed).
- `cfg.cssEntry: ".ds-compiled.css"` (bounded to PKG_DIR; appended to `_ds_bundle.css`,
  which `styles.css` @imports → ships to designs).
- **`.ds-compiled.css` is gitignored** (regenerated each build; lives inside the subtree
  dir but never committed/pushed).

## process.env shim (CRITICAL — required after EVERY build)

Core components read `process.env.NEXT_PUBLIC_*` at module scope (e.g.
`auth-core/config.ts` → `CURRENT_APP`, imported transitively by even leaf components
like `Spinner`). Next replaces these at build; the esbuild bundle only defines
`process.env.NODE_ENV`, so every other ref throws `ReferenceError: process is not
defined` at render. **`.design-sync/patch-bundle.mjs` injects a `process` shim as
line 2 of `_ds_bundle.js`** (line 1 stays the `@ds-bundle` contract header) and
refreshes `_ds_sync.json`'s `bundleSha12` (else validate reports the anchor stale).

**Run order, every time:**

```
node .design-sync/compile-css.mjs src/app/globals.css src/lib/core/.ds-compiled.css
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle
node .design-sync/patch-bundle.mjs ./ds-bundle    # <-- do NOT skip
node .ds-sync/package-validate.mjs ./ds-bundle
```

`preview-rebuild.mjs` does NOT touch `_ds_bundle.js`, so the shim survives subagent
preview rebuilds — only full `package-build.mjs` / the `resync.mjs` driver overwrite
it and need re-patching afterward (the driver builds internally, so on re-sync run
the driver, then patch, then re-validate before upload).

## Fonts

- `cfg.extraFonts: [".design-sync/ds-fonts.css"]` — a hand-authored `@font-face` file
  whose url()s resolve to the real ttfs under `public/fonts/` (Space Grotesk + Orbitron).
  The converter copies them into `fonts/` and rewrites url()s to `./fonts/<basename>`.
  (Bare-ttf extraFonts entries do NOT work here — the globals.css `@font-face` use
  absolute `/fonts/...` urls that `extractFonts` can't resolve, which is why we strip
  them and supply this file instead.)
- **JetBrains Mono** is referenced only in the `font-family: mono` fallback chain and
  is NOT shipped by the app either (relies on system mono). Suppressed via
  `cfg.runtimeFontPrefixes: ["JetBrains"]` — accepted substitute, matches app behavior.

## Config decisions

- `componentSrcMap: {"SupportModal": null}` — SupportModal is a `export default`; the
  synth entry's `export *` doesn't re-export defaults, so it isn't on the global
  (`[BUNDLE_EXPORT]`). Excluded (it's app-coupled, floor-card-only anyway).
- `overrides.ConfirmModal: {cardMode:"single", viewport:"560x440"}` — it's an overlay
  (Flowbite Modal); single mode renders the open dialog inside the card.

## Known render warns (triaged benign — do NOT chase on re-sync)

- `[RENDER_THIN] AnimatedLogo`, `BrandSpinner` — SVG logo marks with no text; they
  paint fine (confirmed in screenshots), the heuristic just measures no text.
- `[RENDER_THIN] ConfirmModal` ("0px height") — the Modal renders via a portal, so the
  card root measures 0; the dialog itself renders correctly (confirmed in screenshot).

## Curated previews (24 authored, all graded good)

ui-components: Spinner, StatCard, EmptyState, LoadingState, ConfirmModal.
forms: StatusAlert, PasswordRequirements, SettingsCard, SettingsFormField.
settings: SettingsPageHeader. layout: PageHeader, PageContainer, SettingsContainer.
general: AnimatedLogo, BrandSpinner, LogoBadge, PageLayout. chat: ChatMessage,
ChatHeader, ChatInputArea, DeepResearchToggle. api-keys: ApiKeyDisplay,
SecureApiKeyField. console: ProgressiveText.
The other ~33 components ship the floor card (app-coupled: auth flows, providers,
selectors, data views) — authorable incrementally on any later re-sync.

### Component facts worth knowing (from source, not the stub .d.ts)

- **SecureApiKeyField / ApiKeyDisplay**: masked display is `keyId.slice(0,8)` + 24 dots
  (NOT derived from `apiKey`). Pick a readable `keyId` prefix (`rfs_live`, …).
- **ChatInputArea**: needs `textareaRef` — `{current:null} as RefObject<...>` works in a
  no-hook preview. Loading swaps textarea text to `"<Deep research|Thinking><dots>"`.
- **DeepResearchToggle**: `absolute top-3 left-3` — wrap in a sized `relative` parent.
- **ProgressiveText**: typewriter (~1ms/char → instant for capture); bare `<span>`, wrap
  for font/color; multiline needs `whitespace-pre-line` + JS `\n`.
- **PasswordRequirements**: `isValid` is tri-state (undefined/true/false).
- **ChatMessage**: `user` 'You'→teal right bubble / 'Agent'→gray left card; `isPartial`
  → spinner+progress; `taskId` → "Deep research" clock badge; body is react-markdown.

## Re-sync risks / watch-list

- **Must re-run `patch-bundle.mjs` after every full build / driver run** (see above) —
  the single most important step; skipping it reintroduces the `process` ReferenceError
  and a stale anchor.
- **Recompile `.ds-compiled.css`** when `globals.css` or `tailwind.config.ts` change
  (brand tokens, fonts, utilities). The compiled file is gitignored, so a fresh clone
  must compile it before the first build.
- Recreate the `node_modules/@robosystems/core` symlink on a fresh clone.
- Synth-entry `.d.ts` are stubs; the value is in the previews + this file. If the core
  adds a real build with `dist/` + types later, point `--entry` at it and the contracts
  get richer automatically.
- This is one of 3 sibling apps (roboledger-app, roboinvestor-app) sharing this exact
  core via subtree. Previews/config here are REUSABLE for those — only the brand color
  palette in their `globals.css`/`tailwind.config.ts` differs (RoboSystems=blue,
  RoboLedger=violet, RoboInvestor=emerald). Replication = copy `.design-sync/` (minus
  projectId), recompile CSS against that app's globals, rebuild+patch, re-grade for
  brand color, upload to that app's own project.

## App identity / logo brand (per-app)

`.design-sync/app-name` holds this app's name (robosystems | roboledger | roboinvestor).
`patch-bundle.mjs` reads it and injects `NEXT_PUBLIC_APP_NAME` into the process shim so
CURRENT_APP resolves correctly and the LOGO components (LogoBadge, AnimatedLogo,
BrandSpinner) render THIS app's mark + brand color. CSS brand colors (primary/secondary/
accent utilities) are already per-app via the compiled stylesheet; this fixes the
JS-driven logo brand, which otherwise defaults to the RoboSystems blue mark on every app.
Re-sync: keep `.design-sync/app-name` correct per app; the patch step handles the rest.
