'use client'

import { Modal } from '@robosystems/core/ui'
import ContactForm from './ContactForm'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  formType?: string
}

export default function ContactModal({
  isOpen,
  onClose,
  title = 'Contact Us',
  description = "Send us a message and we'll get back to you as soon as possible.",
  formType = 'general',
}: ContactModalProps) {
  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      size="2xl"
      // Overlay tint; the former per-call theme used the Tailwind v3 `bg-opacity-50`, which v4 ignores.
      className="bg-zinc-900/50"
    >
      <div className="relative rounded-lg border border-gray-700 bg-linear-to-br from-zinc-900 to-zinc-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-white"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h3 className="font-heading mb-2 text-2xl font-bold text-white">
              {title}
            </h3>
            <p className="text-gray-300">{description}</p>
          </div>
          <ContactForm onClose={onClose} formType={formType} />
        </div>
      </div>
    </Modal>
  )
}
