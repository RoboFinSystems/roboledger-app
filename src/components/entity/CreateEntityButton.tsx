'use client'

import { customTheme } from '@/lib/core'
import { Button } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { HiPlus } from 'react-icons/hi'

interface CreateEntityButtonProps {
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  buttonText?: string
  showIcon?: boolean
  className?: string
}

export default function CreateEntityButton({
  buttonSize = 'sm',
  buttonText = 'Create Knowledge Graph',
  showIcon = true,
  className = '',
}: CreateEntityButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push('/graphs/new')
  }

  return (
    <Button
      theme={customTheme.button}
      color="blue"
      size={buttonSize}
      onClick={handleClick}
      className={className}
    >
      {showIcon && <HiPlus className="mr-2 -ml-1 h-5 w-5" />}
      {buttonText}
    </Button>
  )
}
