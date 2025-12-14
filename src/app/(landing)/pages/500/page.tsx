import { Button } from 'flowbite-react'
import Image from 'next/image'
import { HiChevronLeft } from 'react-icons/hi'

export default function ServerErrorPage() {
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
        <Button color="primary" href="/" className="inline-flex p-px">
          <div className="mr-1 flex items-center gap-x-2">
            <HiChevronLeft className="text-xl" /> Go back home
          </div>
        </Button>
      </div>
    </div>
  )
}
