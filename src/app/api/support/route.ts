import { contactRateLimiter } from '@/lib/rate-limiter'
import { snsService } from '@/lib/sns'
import {
  getClientIp,
  isCaptchaRequired,
  verifyTurnstileToken,
} from '@/lib/turnstile-server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per hour for support)
    const rateLimitResult = await contactRateLimiter.check(request, 5)

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

    // Build metadata section for the message
    const metadata = body.metadata || {}
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

    // Send SNS notification via the contact form publisher
    await snsService.publishContactForm({
      name: body.name,
      email: body.email,
      company: metadata.orgName || 'N/A',
      message: `[RoboLedger Support] [Subject: ${body.subject}]\n\n${body.message}${metadataSection}`,
      formType: 'support',
    })

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
