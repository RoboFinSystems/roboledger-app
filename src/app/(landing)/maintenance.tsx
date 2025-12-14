'use client'

import Image from 'next/image'

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center">
        <Image
          src="/images/logo.png"
          alt="RoboLedger Logo"
          width={120}
          height={120}
        />
        <h1 className="font-heading mt-8 text-3xl font-semibold text-white">
          RoboLedger
        </h1>
      </div>
    </div>
  )
}
