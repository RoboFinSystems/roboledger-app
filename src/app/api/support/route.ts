import { supportRateLimiter } from '@/lib/rate-limiter'
import { snsService } from '@/lib/sns'
import {
  getClientIp,
  isCaptchaRequired,
  verifyTurnstileToken,
} from '@/lib/turnstile-server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const METADATA_KEYS = [
  'orgName',
  'orgId',
  'orgType',
  'graphName',
  'graphId',
  'userRole',
] as const
const MAX_METADATA_VALUE = 200

type SupportMetadata = Partial<Record<(typeof METADATA_KEYS)[number], string>>

/** The known context fields, as single-line strings of bounded length. */
function boundedMetadata(raw: unknown): SupportMetadata {
  const out: SupportMetadata = {}
  if (!raw || typeof raw !== 'object') return out
  for (const key of METADATA_KEYS) {
    const value = (raw as Record<string, unknown>)[key]
    if (typeof value !== 'string') continue
    const line = value.replace(/[\r\n]+/g, ' ').trim()
    if (line) out[key] = line.slice(0, MAX_METADATA_VALUE)
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per hour for support)
    const rateLimitResult = await supportRateLimiter.check(request, 5)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.reset.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}`, code: 'MISSING_FIELD' },
          { status: 400 }
        )
      }
    }

    // Enforce string types and bound field lengths on the required fields to
    // reject oversized or malformed payloads before they reach SNS.
    const fieldLimits: Array<[string, number]> = [
      ['name', 200],
      ['email', 254],
      ['subject', 300],
      ['message', 5000],
    ]
    for (const [field, maxLen] of fieldLimits) {
      const value = body[field]
      if (typeof value !== 'string' || value.length > maxLen) {
        return NextResponse.json(
          {
            error: `Invalid or too-long field: ${field}`,
            code: 'INVALID_FIELD',
          },
          { status: 400 }
        )
      }
    }

    // Verify CAPTCHA if required
    if (isCaptchaRequired()) {
      const captchaToken = body.captchaToken

      if (!captchaToken) {
        return NextResponse.json(
          { error: 'CAPTCHA verification is required' },
          { status: 400 }
        )
      }

      const clientIp = getClientIp(request)
      const verifyResult = await verifyTurnstileToken(captchaToken, clientIp)

      if (!verifyResult.success) {
        return NextResponse.json(
          { error: 'CAPTCHA verification failed' },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (body.email.length > 254 || !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    // Build metadata section for the message. Only short strings are kept:
    // the context block is informational, never a second message body.
    const metadata = boundedMetadata(body.metadata)
    const metadataLines = [
      metadata.orgName && `Organization: ${metadata.orgName}`,
      metadata.orgId && `Org ID: ${metadata.orgId}`,
      metadata.orgType && `Org Type: ${metadata.orgType}`,
      metadata.graphName && `Graph: ${metadata.graphName}`,
      metadata.graphId && `Graph ID: ${metadata.graphId}`,
      metadata.userRole && `Role: ${metadata.userRole}`,
    ].filter(Boolean)

    const metadataSection =
      metadataLines.length > 0
        ? `\n\n--- Context ---\n${metadataLines.join('\n')}`
        : ''

    // Send SNS notification via the contact form publisher. A publish that
    // did not land is a failed submission, not a sent one.
    const delivered = await snsService.publishContactForm({
      name: body.name,
      email: body.email,
      company: metadata.orgName || 'N/A',
      message: `[RoboLedger Support] [Subject: ${body.subject}]\n\n${body.message}${metadataSection}`,
      formType: 'support',
    })
    if (!delivered) {
      return NextResponse.json(
        {
          error: 'Your message could not be delivered. Please try again later.',
          code: 'SUBMISSION_NOT_DELIVERED',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { message: 'Support message sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    const errorLog = {
      event: 'support_submission_error',
      endpoint: '/api/support',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(errorLog))
    } else {
      console.error('Support submission error:', errorLog)
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
