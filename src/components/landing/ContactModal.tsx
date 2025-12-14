'use client'

import { Modal } from 'flowbite-react'
import ContactForm from './ContactForm'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  formType?: string
}

const customTheme = {
  root: {
    base: 'fixed top-0 right-0 left-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full',
    show: {
      on: 'flex bg-zinc-900 bg-opacity-50',
      off: 'hidden',
    },
  },
  content: {
    base: 'relative h-full w-full p-4 md:h-auto',
    inner:
      'relative rounded-lg bg-zinc-900 shadow-sm flex flex-col max-h-[90vh]',
  },
  body: {
    base: 'p-6 flex-1 overflow-auto',
  },
  header: {
    base: 'flex items-start justify-between rounded-t border-b border-gray-600 p-5',
    title: 'text-xl font-medium text-gray-900',
    close: {
      base: 'ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-zinc-200 hover:text-gray-900',
      icon: 'h-5 w-5',
    },
  },
}

export default function ContactModal({
  isOpen,
  onClose,
  title = 'Contact Us',
  description = "Send us a message and we'll get back to you as soon as possible.",
  formType = 'general',
}: ContactModalProps) {
  return (
    <Modal show={isOpen} onClose={onClose} size="2xl" theme={customTheme}>
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
