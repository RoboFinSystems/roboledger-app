// Compile a static Tailwind v4 stylesheet from an app's globals.css for the
// design-sync bundle. Run from the app root so the @config / @source / content
// globs resolve. Tailwind generates utilities by scanning the config's content
// (which covers src/lib/core) plus any extra @source we inject for previews.
//   node .ds-sync/compile-css.mjs <globals.css> <out.css>
import tailwind from '@tailwindcss/postcss'
import { readFileSync, writeFileSync } from 'node:fs'
import postcss from 'postcss'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('usage: compile-css.mjs <input.css> <output.css>')
  process.exit(1)
}
// Inject the previews dir as an extra content source so preview-only utility
// classes are generated too (the config globs already cover src/lib/core).
// Scan previews AND a brand-color safelist so the full brand palette (every
// family × scale × bg/text/border/ring + hover/dark/focus variants) ships in
// styles.css — designs the claude.ai/design agent builds receive only this
// static stylesheet, so any brand utility it reaches for must already be here.
const extraSource =
  `@source "./.design-sync/previews/**/*.{tsx,jsx}";\n` +
  `@source "./.design-sync/tw-safelist.txt";\n`
const css = extraSource + readFileSync(input, 'utf8')
const result = await postcss([tailwind()]).process(css, {
  from: input,
  to: output,
})
// Strip @font-face — fonts are wired via cfg.extraFonts (.design-sync/ds-fonts.css)
// whose url()s resolve to the real ttfs. Keeping the globals.css @font-face here
// would inject dangling /fonts/... url()s (extractFonts can't resolve absolute
// paths) into fonts/fonts.css. The brand families are referenced by name in the
// utilities below; the extraFonts .css supplies the matching @font-face.
const stripped = result.css.replace(/@font-face\s*\{[^}]*\}/g, '')
writeFileSync(output, stripped)
console.error(
  `✓ compiled ${output}: ${(stripped.length / 1024).toFixed(0)} KB (@font-face stripped → extraFonts)`
)
