import { Button } from 'flowbite-react'
import Image from 'next/image'
import Link from 'next/link'
import { HiChevronLeft } from 'react-icons/hi'

export default function MaintenancePage() {
  return (
    <div className="mx-auto flex h-screen flex-col items-center justify-center px-6 xl:px-0">
      <div className="mb-5 block md:max-w-md">
        <Image
          alt=""
          height={450}
          src="/images/illustrations/maintenance.svg"
          width={450}
        />
      </div>
      <div className="text-center xl:max-w-4xl">
        <h1 className="mb-3 text-2xl leading-tight font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
          Under Maintenance
        </h1>
        <p className="mb-5 text-center text-base font-normal text-gray-500 md:text-lg dark:text-gray-400">
          Sorry for the inconvenience but we&apos;re performing some maintenance
          at the moment. If you need to you can always&nbsp;
          <Link
            href="#"
            className="text-primary-700 dark:text-primary-500 hover:underline"
          >
            contact us
          </Link>
          , otherwise we&apos;ll be back online shortly!
        </p>
        <Button color="blue" href="/" className="inline-flex p-px">
          <div className="mr-1 flex items-center gap-x-2">
            <HiChevronLeft className="text-xl" /> Go back home
          </div>
        </Button>
      </div>
    </div>
  )
}
