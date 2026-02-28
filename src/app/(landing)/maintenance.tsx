'use client'

import { AnimatedLogo } from '@/lib/core/ui-components/Logo'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center">
        <AnimatedLogo
          animate="once"
          className="h-[120px] w-[120px] text-white"
        />
        <h1 className="font-heading mt-8 text-3xl font-semibold text-white">
          RoboLedger
        </h1>
      </div>
    </div>
  )
}
