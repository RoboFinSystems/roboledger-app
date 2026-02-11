'use client'

import { useEffect, useState } from 'react'

export function ProgressiveText({
  text,
  onComplete,
  speed = 1,
  onUpdate,
}: {
  text: string
  onComplete?: () => void
  speed?: number
  onUpdate?: () => void
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
        onUpdate?.() // Trigger scroll update
      }, speed)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete, onUpdate])

  return <span>{displayedText}</span>
}
