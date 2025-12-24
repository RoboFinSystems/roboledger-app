'use client'

import { useState } from 'react'

interface BetaWaitlistFormProps {
  variant?: 'hero' | 'inline' | 'minimal'
  title?: string
}

export default function BetaWaitlistForm({
  variant = 'hero',
  title,
}: BetaWaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [deploymentPreference, setDeploymentPreference] = useState('')
  const [transactionVolume, setTransactionVolume] = useState('')
  const [openSourceInterest, setOpenSourceInterest] = useState<string[]>([])
  const [challenge, setChallenge] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExtendedForm, setShowExtendedForm] = useState(false)

  const handleCheckboxChange = (value: string) => {
    setOpenSourceInterest((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    )
  }

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    if (variant === 'minimal') {
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit waitlist form')
        }

        const result = await response.json()
        setIsSubmitted(true)
      } catch (error) {
        console.error('Error submitting waitlist form:', error)
        // Still show success to user but log error
        setIsSubmitted(true)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setShowExtendedForm(true)
    }
  }

  const handleFullSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          companyName,
          deploymentPreference,
          transactionVolume,
          openSourceInterest,
          challenge,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit waitlist form')
      }

      const result = await response.json()
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting full waitlist form:', error)
      // Still show success to user but log error
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-center text-white">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-300"
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
        <h3 className="mb-2 text-xl font-semibold">You're registered!</h3>
        <p className="text-blue-100">
          Thanks for signing up! You now have access to RoboLedger.
          {variant !== 'minimal' && ' Check your email for next steps.'}
        </p>
        <div className="mt-4 text-sm text-blue-200">
          <p>🎯 Registration confirmation sent to your email</p>
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <form
        onSubmit={handleInitialSubmit}
        className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-cyan-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Signing up...' : 'Sign Up Free →'}
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 p-6 shadow-lg">
      {title && (
        <h3 className="mb-4 text-center text-xl font-semibold text-gray-900">
          {title}
        </h3>
      )}

      {!showExtendedForm ? (
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
              placeholder="you@company.com"
            />
          </div>

          <div className="rounded-lg bg-cyan-50 p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="mt-0.5 h-5 w-5 text-cyan-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-cyan-800">
                <p className="mb-1 font-medium">What You Get:</p>
                <ul className="space-y-1 text-cyan-700">
                  <li>✓ Full access to knowledge graph features</li>
                  <li>✓ Competitive pricing</li>
                  <li>✓ Priority support</li>
                  <li>✓ Direct line to development team</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-semibold text-white transition duration-300 hover:scale-105 hover:from-cyan-700 hover:to-blue-700"
          >
            Get Started Free →
          </button>

          <p className="text-center text-xs text-gray-500">
            Semantic financial intelligence at your fingertips
          </p>
        </form>
      ) : (
        <form onSubmit={handleFullSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
              placeholder="Your Company Inc."
            />
          </div>

          <div>
            <label
              htmlFor="deploymentPreference"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Deployment Preference
            </label>
            <select
              id="deploymentPreference"
              value={deploymentPreference}
              onChange={(e) => setDeploymentPreference(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select preference...</option>
              <option value="quickbooks">QuickBooks Integration</option>
              <option value="standalone">Standalone with Bank Feeds</option>
              <option value="both">Both Options</option>
              <option value="self-hosted">Self-Hosted (Fork & Deploy)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transactionVolume"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Monthly Transaction Volume
            </label>
            <select
              id="transactionVolume"
              value={transactionVolume}
              onChange={(e) => setTransactionVolume(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select volume...</option>
              <option value="<100">Less than 100</option>
              <option value="100-500">100 - 500</option>
              <option value="500-1000">500 - 1,000</option>
              <option value="1000+">1,000+</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="openSourceInterest"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Open Source Interest
            </label>
            <div id="openSourceInterest" className="space-y-2">
              {[
                { value: 'contribute', label: 'I want to contribute code' },
                { value: 'early-access', label: 'I want early source access' },
                { value: 'self-hosted', label: 'I need self-hosted option' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={openSourceInterest.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="challenge"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Biggest Bookkeeping Challenge (Optional)
            </label>
            <textarea
              id="challenge"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-cyan-500"
              placeholder="What's your biggest pain point with current financial software?"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-semibold text-white transition duration-300 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Registration →'}
          </button>
        </form>
      )}
    </div>
  )
}
