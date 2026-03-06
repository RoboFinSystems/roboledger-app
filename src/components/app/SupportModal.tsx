'use client'

import { useUser } from '@/lib/core'
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Textarea,
  TextInput,
} from 'flowbite-react'
import { useState } from 'react'

export interface SupportMetadata {
  graphId?: string | null
  graphName?: string | null
  orgId?: string | null
  orgName?: string | null
  orgType?: string | null
  userRole?: string | null
}

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
  metadata?: SupportMetadata
}

export default function SupportModal({
  isOpen,
  onClose,
  metadata,
}: SupportModalProps) {
  const { user } = useUser()
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const handleClose = () => {
    setMessage('')
    setSubject('')
    setSubmitStatus('idle')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          subject,
          message,
          metadata: metadata || {},
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(handleClose, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal show={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>Contact Support</ModalHeader>
      <ModalBody>
        {submitStatus === 'success' ? (
          <div className="py-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Message Sent!
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Our team will get back to you as soon as possible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="support-subject" className="mb-2 block">
                Subject
              </Label>
              <TextInput
                id="support-subject"
                type="text"
                required
                placeholder="Brief description of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="support-message" className="mb-2 block">
                Message
              </Label>
              <Textarea
                id="support-message"
                rows={5}
                required
                placeholder="Please describe your issue or question in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {submitStatus === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-500">
                Something went wrong. Please try again later.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                color="gray"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        )}
      </ModalBody>
    </Modal>
  )
}
