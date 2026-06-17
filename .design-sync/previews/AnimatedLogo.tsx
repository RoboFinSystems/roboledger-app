import { AnimatedLogo } from '@robosystems/core'

/** The RoboSystems mark at a few sizes. Follows currentColor. */
export const Sizes = () => (
  <div className="flex items-end gap-6 text-gray-900">
    <AnimatedLogo className="h-10 w-10" animate="once" />
    <AnimatedLogo className="h-16 w-16" animate="once" />
    <AnimatedLogo className="h-24 w-24" animate="once" />
  </div>
)

/** The `brand` prop fills the mark with the app's brand color. */
export const BrandColored = () => (
  <AnimatedLogo className="h-24 w-24" brand animate="once" />
)
