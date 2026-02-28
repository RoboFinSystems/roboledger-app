'use client'

import { isTurnstileEnabled, isTurnstileValid } from '@/lib/config/turnstile'
import {
  TurnstileWidget,
  type TurnstileWidgetRef,
} from '@/lib/core/auth-components/TurnstileWidget'
import { Button, Label, TextInput, Textarea } from 'flowbite-react'
import { useRef, useState } from 'react'

interface GraphLimitFormProps {
  onClose: () => void
  userEmail?: string
}

export default function GraphLimitForm({
  onClose,
  userEmail = '',
}: GraphLimitFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail,
    phone: '',
    company: '',
    graphsNeeded: '',
    useCase: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetRef>(null)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if CAPTCHA is required and not completed
    if (!isTurnstileValid(captchaToken)) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          message: `[GRAPH LIMIT REQUEST]
Phone: ${formData.phone || 'Not provided'}
Graphs Needed: ${formData.graphsNeeded}
Use Case: ${formData.useCase}`,
          type: 'graph-limit-request',
          captchaToken: captchaToken,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        if (process.env.NODE_ENV === 'development') {
          const error = await response.json()
          console.error('Graph limit request error:', error)
        }
        setSubmitStatus('error')

        // Reset CAPTCHA on error
        if (turnstileRef.current) {
          turnstileRef.current.reset()
          setCaptchaToken(null)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Graph limit request error:', error)
      }
      setSubmitStatus('error')

      // Reset CAPTCHA on error
      if (turnstileRef.current) {
        turnstileRef.current.reset()
        setCaptchaToken(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="py-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
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
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">
          Request Submitted!
        </h3>
        <p className="text-gray-300">
          We'll review your request and increase your graph limit within 24
          hours. You'll receive a confirmation email once it's been updated.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="mb-2 block text-white">
          Full Name *
        </Label>
        <TextInput
          id="name"
          name="name"
          type="text"
          required
          placeholder="John Doe"
          value={formData.name}
          onChange={handleInputChange}
          className="border-gray-700 bg-zinc-800 text-white"
        />
      </div>

      <div>
        <Label htmlFor="email" className="mb-2 block text-white">
          Email *
        </Label>
        <TextInput
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleInputChange}
          className="border-gray-700 bg-zinc-800 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company" className="mb-2 block text-white">
            Company *
          </Label>
          <TextInput
            id="company"
            name="company"
            type="text"
            required
            placeholder="Acme Inc."
            value={formData.company}
            onChange={handleInputChange}
            className="border-gray-700 bg-zinc-800 text-white"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="mb-2 block text-white">
            Phone Number
          </Label>
          <TextInput
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={handleInputChange}
            className="border-gray-700 bg-zinc-800 text-white"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="graphsNeeded" className="mb-2 block text-white">
          How many graphs do you need? *
        </Label>
        <TextInput
          id="graphsNeeded"
          name="graphsNeeded"
          type="text"
          required
          placeholder="e.g., 10 graphs, 50 graphs, unlimited"
          value={formData.graphsNeeded}
          onChange={handleInputChange}
          className="border-gray-700 bg-zinc-800 text-white"
        />
      </div>

      <div>
        <Label htmlFor="useCase" className="mb-2 block text-white">
          Tell us about your use case *
        </Label>
        <Textarea
          id="useCase"
          name="useCase"
          rows={4}
          required
          placeholder="Describe what you're building and how you'll use the graphs..."
          value={formData.useCase}
          onChange={handleInputChange}
          className="border-gray-700 bg-zinc-800 text-white"
        />
      </div>

      {/* Turnstile CAPTCHA Widget */}
      {isTurnstileEnabled() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onError={() => setCaptchaToken(null)}
            onExpire={() => setCaptchaToken(null)}
            theme="dark"
            disabled={isSubmitting}
          />
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="text-sm text-red-500">
          {!isTurnstileValid(captchaToken)
            ? 'Please complete the security verification.'
            : 'Something went wrong. Please try again later.'}
        </div>
      )}

      <div className="flex gap-3 pt-4 pb-8">
        <Button
          type="submit"
          disabled={isSubmitting || !isTurnstileValid(captchaToken)}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700"
        >
          {isSubmitting ? 'Submitting...' : 'Request Higher Limit'}
        </Button>
        <Button
          type="button"
          color="gray"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
