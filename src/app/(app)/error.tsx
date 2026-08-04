'use client'

import { Button } from 'flowbite-react'
import Image from 'next/image'
import { useEffect } from 'react'
import { HiChevronLeft, HiRefresh } from 'react-icons/hi'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center px-6 xl:px-0">
      <div className="block md:max-w-lg">
        <Image
          alt=""
          height={550}
          src="/images/illustrations/500.svg"
          width={550}
        />
      </div>
      <div className="text-center xl:max-w-4xl">
        <h1 className="font-heading mb-3 text-2xl leading-tight font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
          Something has gone seriously wrong
        </h1>
        <p className="mb-5 text-base font-normal text-gray-500 md:text-lg dark:text-gray-400">
          It&apos;s always time for a coffee break. We should be back by the
          time you finish your coffee.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-5 rounded-lg bg-gray-100 p-4 text-left dark:bg-gray-800">
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Error details:
            </p>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button color="primary" onClick={reset} className="inline-flex p-px">
            <div className="mr-1 flex items-center gap-x-2">
              <HiRefresh className="text-xl" /> Try Again
            </div>
          </Button>
          <Button color="gray" href="/home" className="inline-flex p-px">
            <div className="mr-1 flex items-center gap-x-2">
              <HiChevronLeft className="text-xl" /> Go Home
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
