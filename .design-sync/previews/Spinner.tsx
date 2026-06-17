import { Spinner } from '@robosystems/core'

/** The full size scale, xs → xl. The ring follows currentColor (brand primary). */
export const Sizes = () => (
  <div className="flex items-end gap-6 p-2">
    <Spinner size="xs" />
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
    <Spinner size="xl" />
  </div>
)

/** On a brand-filled surface the ring is recolored via the text color. */
export const OnBrandSurface = () => (
  <div className="bg-primary-600 flex items-center gap-3 rounded-lg px-5 py-3 text-white">
    <Spinner size="sm" className="text-white" />
    <span className="text-sm font-medium">Saving changes…</span>
  </div>
)
