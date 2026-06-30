// design-sync entry barrel — RoboLedger app-focused build.
//
// The package-shape synth entry only re-exports via `export *`, which skips
// default exports; every landing section is a default export. This barrel names
// each component so the converter discovers them (cfg.entry → IIFE bundle entry
// → window.RoboledgerApp.*). Relative paths keep the barrel itself alias-free;
// the components' own `@/…` and `next/*` imports resolve through esbuild's
// tsconfig (cfg.tsconfig → .design-sync/tsconfig.json).
//
// Scope: Phase 1 = landing / brand surface (src/components/landing/). The
// app-distinctive views (ledger, reports, console, entity browser) are a later
// phase — they read provider/session context and only render a floor card here.

export { default as AIReportingSection } from '../src/components/landing/AIReportingSection'
export { default as ContactForm } from '../src/components/landing/ContactForm'
export { default as ContactModal } from '../src/components/landing/ContactModal'
export { default as FeaturesSection } from '../src/components/landing/FeaturesSection'
export { default as FinalCTA } from '../src/components/landing/FinalCTA'
export { default as FloatingElementsVariant } from '../src/components/landing/FloatingElementsVariant'
export { default as Footer } from '../src/components/landing/Footer'
export { default as Header } from '../src/components/landing/Header'
export { default as HeroSection } from '../src/components/landing/HeroSection'
export { default as OpenSourceSection } from '../src/components/landing/OpenSourceSection'
export { default as OutputFormats } from '../src/components/landing/OutputFormats'
export { default as PlatformSection } from '../src/components/landing/PlatformSection'
export { default as ReportCreator } from '../src/components/landing/ReportCreator'
export { default as WorkflowSection } from '../src/components/landing/WorkflowSection'
