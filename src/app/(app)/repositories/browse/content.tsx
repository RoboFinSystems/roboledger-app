'use client'

import { BrowseRepositories } from '@/lib/core'
import { useRouter } from 'next/navigation'

export function BrowseRepositoriesContent() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <BrowseRepositories
        onSubscribed={(repoType) =>
          router.push(`/repositories/${repoType}/getting-started`)
        }
        onViewSubscriptions={() => router.push('/repositories')}
        onUpgrade={(repoType, planName) =>
          router.push(`/repositories/${repoType}/upgrade?tier=${planName}`)
        }
      />
    </div>
  )
}
