# Building with the RoboLedger design system

This is **RoboLedger's own landing / brand surface** — the violet-branded marketing
sections of the RoboLedger app (an AI-powered accounting & financial-reporting
product built on the RoboSystems knowledge-graph platform). It is built on
**Flowbite React** + **Tailwind CSS v4**. Components are exported from
`window.RoboledgerApp.*`.

> This is distinct from `@robosystems/core` (the shared component library — buttons,
> modals, forms, layout). Those live in the RoboSystems design system. Here you'll
> find the composed, full-bleed **page sections** unique to RoboLedger.

## Setup & wrapping

No provider wrapper is needed — these are presentational marketing sections that
render standalone. **Styling is global CSS**: the bundle ships `styles.css` (brand
tokens, fonts, compiled Tailwind utilities) — load it once and every component and
utility class below is available. The surface is **dark by default** (sections paint
their own near-black backgrounds). The brand fonts **Space Grotesk** (body/UI) and
**Orbitron** (display headings) are bundled and applied automatically.

Most sections take **no props** — drop them in and they fill the width:

```jsx
const { Header, HeroSection, FeaturesSection, FinalCTA, Footer } =
  window.RoboledgerApp

function Landing() {
  return (
    <>
      <Header />
      <HeroSection />
      <FeaturesSection />
      <FinalCTA />
      <Footer />
    </>
  )
}
```

`ContactModal` is the exception (it takes `isOpen` / `onClose` / `title` /
`description` / `formType`), `ContactForm` takes `onClose` / `formType`, and
`FloatingElementsVariant` takes a `variant` — see their previews.

## The components

| Group `landing`           | What it is                                                                      |
| ------------------------- | ------------------------------------------------------------------------------- |
| `Header`                  | Fixed top nav — logo/wordmark, section links, sign-in/up actions                |
| `HeroSection`             | Full hero — gradient headline, value prop, primary CTA ("Built on RoboSystems") |
| `FeaturesSection`         | The before/after pitch — "Publish & Pray" → "Events Flow In" → "Publish & File" |
| `WorkflowSection`         | The end-to-end ledger → close → report workflow walkthrough                     |
| `ReportCreator`           | Interactive report-builder demo — multi-axis view, template library             |
| `OutputFormats`           | The output/report formats RoboLedger produces                                   |
| `AIReportingSection`      | AI-powered reporting walkthrough — question → financial insight                 |
| `PlatformSection`         | "Powered by RoboSystems" — the RoboLedger knowledge-graph schema                |
| `FinalCTA`                | Closing call-to-action band                                                     |
| `Footer`                  | Site footer — product / applications columns, social, legal                     |
| `OpenSourceSection`       | Open-source & self-hosted pitch — customization, community                      |
| `ContactForm`             | Name / email / company / message form with violet submit                        |
| `ContactModal`            | The contact form in a modal (`isOpen`, `onClose`, …)                            |
| `FloatingElementsVariant` | Ambient brand-motion blobs (`variant`) layered behind sections                  |

## Styling idiom — Tailwind utilities, brand palette

Style with **Tailwind v4 utility classes** (no CSS-module names to import). The brand
color families each carry the full `50…950` scale:

| Family        | Role                                        | Example                                  |
| ------------- | ------------------------------------------- | ---------------------------------------- |
| `primary-*`   | brand **violet** — primary actions, accents | `bg-primary-600`, `hover:bg-primary-700` |
| `secondary-*` | purple — secondary accents, gradients       | `from-secondary-500`                     |
| `accent-*`    | fuchsia — tertiary accents, gradients       | `text-accent-500`                        |
| `gray-*`      | neutral text/surfaces/borders               | `text-gray-300`, `border-gray-800`       |
| `amber-*`     | warm/warning accent                         | `bg-amber-500`                           |

Type: `font-sans` (Space Grotesk) for UI/body; `font-heading` (Orbitron) for display
headings. The canonical primary button:
`className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"`.

Sections are dark, full-bleed, and lean on layered gradients
(`bg-linear-to-br from-primary-900/20 …`) plus the floating-blob motion system.

## Where the truth lives

- `styles.css` (and the `_ds_bundle.css` it imports) — the actual tokens and compiled
  utilities. Read it before inventing class names.
- Per component: `<Name>.d.ts` (props) and `<Name>.prompt.md` (usage), plus the
  preview card for a worked example.

Icons are [`react-icons`](https://react-icons.github.io/react-icons/) (`react-icons/hi`).
