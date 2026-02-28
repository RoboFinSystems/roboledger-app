'use client'

import { customTheme } from '@/lib/core/theme'
import { Modal } from 'flowbite-react'
import GraphLimitForm from './GraphLimitForm'

interface GraphLimitModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  currentLimit?: number
}

export default function GraphLimitModal({
  isOpen,
  onClose,
  userEmail,
  currentLimit = 0,
}: GraphLimitModalProps) {
  return (
    <Modal show={isOpen} onClose={onClose} size="2xl" theme={customTheme.modal}>
      <div className="relative rounded-lg border border-gray-700 bg-gradient-to-br from-zinc-900 to-zinc-800">
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
            <h3 className="mb-2 text-2xl font-bold text-white">
              {currentLimit === 0
                ? 'Request Graph Access'
                : 'Request Higher Graph Limit'}
            </h3>
            <p className="text-gray-300">
              {currentLimit === 0
                ? "Graph creation requires approval. Tell us about your needs and we'll get you set up."
                : `You've reached your current limit of ${currentLimit} graphs. Tell us about your needs and we'll increase your limit.`}
            </p>
          </div>
          <GraphLimitForm onClose={onClose} userEmail={userEmail} />
        </div>
      </div>
    </Modal>
  )
}
