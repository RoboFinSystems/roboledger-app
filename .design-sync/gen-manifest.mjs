// Generate _ds_manifest.json (the claude.ai/design card index) from a built
// bundle. The package-build CLI does NOT emit this — normally the claude.ai/
// design app's server-side self-check regenerates it. That self-check does NOT
// fire on raw DesignSync file uploads, so after a CLI sync the project keeps its
// previous manifest and the pane shows stale / "file not found" cards. Run this
// after package-build/patch and upload the resulting _ds_manifest.json so the
// pane's card index matches the bundle.
//
//   node .design-sync/gen-manifest.mjs ./ds-bundle
//
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.argv[2] || './ds-bundle'

// 1) namespace + components — from the _ds_bundle.js first-line @ds-bundle header
const header = readFileSync(join(OUT, '_ds_bundle.js'), 'utf8').split(
  '\n',
  1
)[0]
const hjson = JSON.parse(
  header.replace(/^\/\* @ds-bundle:\s*/, '').replace(/\s*\*\/\s*$/, '')
)
const namespace = hjson.namespace
const components = hjson.components // [{name, sourcePath}]

// 2) cards — from each component HTML's first-line @dsCard marker
const cards = []
for (const c of components) {
  const htmlPath = c.sourcePath.replace(/\.jsx$/, '.html')
  const first = readFileSync(join(OUT, htmlPath), 'utf8').split('\n', 1)[0]
  const group = (first.match(/group="([^"]+)"/) || [])[1] || 'general'
  const vp = (first.match(/viewport="([^"]+)"/) || [])[1]
  const card = { path: htmlPath, group }
  if (vp) card.viewport = vp
  cards.push(card)
}

// 3) tokens — CSS custom properties from the `:root, :host { ... }` theme blocks
const css = readFileSync(join(OUT, '_ds_bundle.css'), 'utf8')
const kindOf = (n) =>
  /^--color-/.test(n)
    ? 'color'
    : /^--(spacing|container-|blur-)/.test(n)
      ? 'spacing'
      : /^--(text-|font-|tracking-|leading-)/.test(n)
        ? 'font'
        : /^--radius-/.test(n)
          ? 'radius'
          : /shadow/.test(n)
            ? 'shadow'
            : 'other'
const tokenMap = new Map() // last definition wins (so @theme overrides land)
const blockRe = /:root,\s*:host\s*\{/g
let m
while ((m = blockRe.exec(css))) {
  const start = m.index + m[0].length
  const end = css.indexOf('}', start)
  if (end === -1) continue
  const body = css.slice(start, end)
  const declRe = /(--[\w-]+)\s*:\s*([^;]+);/g
  let d
  while ((d = declRe.exec(body))) tokenMap.set(d[1], d[2].trim())
}
const tokens = [...tokenMap].map(([name, value]) => ({
  name,
  value,
  kind: kindOf(name),
  definedIn: '_ds_bundle.css',
}))

// 4) fonts + brandFonts — parse @font-face from fonts/fonts.css
const fontCss = readFileSync(join(OUT, 'fonts/fonts.css'), 'utf8')
const fonts = []
const faceRe = /@font-face\s*\{([\s\S]*?)\}/g
let f
while ((f = faceRe.exec(fontCss))) {
  const b = f[1]
  const family = (b.match(/font-family:\s*'([^']+)'/) || [])[1]
  const weight = (b.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim()
  const style = (b.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || 'normal'
  const file = (b.match(/url\('\.\/([^']+)'\)/) || [])[1]
  if (family && file)
    fonts.push({
      family,
      weight,
      style,
      cssPath: 'fonts/fonts.css',
      files: [`fonts/${file}`],
    })
}
const brandFonts = [...new Set(fonts.map((x) => x.family))].map((family) => ({
  family,
  status: 'unreferenced',
  tokens: [],
  path: 'fonts/fonts.css',
}))

const manifest = {
  namespace,
  components,
  startingPoints: [],
  cards,
  templates: [],
  globalCssPaths: ['fonts/fonts.css', '_ds_bundle.css', 'styles.css'],
  tokens,
  themes: [],
  fonts,
  brandFonts,
  source: 'design-sync-cli',
}
writeFileSync(join(OUT, '_ds_manifest.json'), JSON.stringify(manifest))
console.error(
  `✓ _ds_manifest.json: namespace=${namespace} components=${components.length} cards=${cards.length} tokens=${tokens.length} fonts=${fonts.length}`
)
