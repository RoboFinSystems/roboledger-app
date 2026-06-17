# Building with @robosystems/core

`@robosystems/core` is the shared React design system for the RoboSystems family of
apps (a knowledge-graph / financial-data SaaS). It is built on **Flowbite React** +
**Tailwind CSS v4**. Components are exported from `window.RobosystemsCore.*`.

## Setup & wrapping

No provider wrapper is needed for the presentational components in this library —
they render standalone. **Styling is global CSS**: the bundle ships `styles.css`
(brand tokens, fonts, and compiled Tailwind utilities) — load it once and every
component and every utility class below is available. Dark mode follows a `dark`
class on any ancestor (`dark:` variants are defined throughout). The brand fonts
**Space Grotesk** (body/UI) and **Orbitron** (headings) are bundled and applied by
default — you do not import them.

(A few data/auth components — providers, selectors, auth forms — read React context
or fetch data and aren't meant for static composition; the presentational set below
is what you build screens from.)

## Styling idiom — Tailwind utilities, brand palette

Style everything with **Tailwind v4 utility classes**. There are no CSS-module class
names to import. Use the brand color families (each has the full `50 100 200 300 400
500 600 700 800 900 950` scale) as `bg-/text-/border-` utilities:

| Family        | Role                                         | Example                                                      |
| ------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `primary-*`   | brand (violet) — primary actions, accents    | `bg-primary-600`, `text-primary-600`, `hover:bg-primary-700` |
| `secondary-*` | purple — secondary accents, chat user bubble | `bg-secondary-500`                                           |
| `accent-*`    | fuchsia — tertiary accents, gradients        | `text-accent-500`                                            |
| `gray-*`      | neutral text/surfaces/borders                | `text-gray-500`, `text-gray-900`, `border-gray-200`          |
| `amber-*`     | warm/warning accent                          | `bg-amber-500`                                               |

Type: `font-sans` (Space Grotesk, the default) for UI/body; `font-heading` (Orbitron)
for display headings. Standard Tailwind spacing/radius/shadow utilities apply
(`rounded-lg`, `gap-4`, `shadow`, `py-12`, …). A primary button is the canonical idiom:
`className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"`.

## Where the truth lives

- `styles.css` (and the `_ds_bundle.css` it imports) — the actual tokens and compiled
  utilities. Read it before inventing class names.
- Per component: `<Name>.d.ts` (props) and `<Name>.prompt.md` (usage), plus the preview
  card for a worked example.

## Idiomatic example

```jsx
const { StatCard, EmptyState } = window.RobosystemsCore
import { HiChartBar } from 'react-icons/hi' // the library's icon set

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-gray-900">
        Dashboard
      </h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Graphs" value="12" icon={HiChartBar} />
        <StatCard label="Storage Used" value="1.2 GB" icon={HiChartBar} />
        <StatCard label="Monthly Spend" value="$3,480" icon={HiChartBar} />
      </div>
    </div>
  )
}
```

Icons are [`react-icons`](https://react-icons.github.io/react-icons/) (`react-icons/hi`
is the primary set); components that take an `icon` prop expect such a component.
