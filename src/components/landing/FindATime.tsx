'use client'

import { useState } from 'react'
import ContactModal from './ContactModal'

// The scheduler behind /book is open Thursday and Friday afternoons only, on purpose, so
// every booking button offers the other route: the site's contact form, the same one the
// footer's Contact opens.
export default function FindATime({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <p className={`text-sm text-gray-400 ${className}`}>
        Thursday or Friday afternoon not good?{' '}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Email us
        </button>{' '}
        and we&apos;ll find a time.
      </p>
      <ContactModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Find a time"
        description="Tell us when suits you and we'll find a time for the 20 minutes."
        formType="find-a-time"
      />
    </>
  )
}
