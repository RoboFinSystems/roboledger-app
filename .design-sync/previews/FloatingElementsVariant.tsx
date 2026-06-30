import { FloatingElementsVariant } from 'roboledger-app'

/** Ambient brand-motion blobs (animated, blurred gradient orbs) layered behind
 *  the hero. Absolutely positioned, so they need a sized `relative` parent. */
export const Hero = () => (
  <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-black">
    <FloatingElementsVariant variant="hero" />
  </div>
)

/** The closing-CTA tuning of the same motion system. */
export const Final = () => (
  <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-black">
    <FloatingElementsVariant variant="final" />
  </div>
)
