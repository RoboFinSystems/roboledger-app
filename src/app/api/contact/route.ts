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
    // Apply rate limiting (10 requests per hour)
    const rateLimitResult = await contactRateLimiter.check(request, 10)

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
            'Retry-After': Math.ceil(
              (rateLimitResult.reset.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const body = await request.json()

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
        // Log structured error for monitoring
        const errorLog = {
          event: 'captcha_verification_failed',
          endpoint: '/api/contact',
          errorCodes: verifyResult['error-codes'],
          clientIp,
          timestamp: new Date().toISOString(),
        }

        if (process.env.NODE_ENV === 'production') {
          // In production, send to logging service
          console.error(JSON.stringify(errorLog))
        } else {
          console.error('CAPTCHA verification failed:', errorLog)
        }

        return NextResponse.json(
          {
            error: 'CAPTCHA verification failed. Please try again.',
            code: 'CAPTCHA_FAILED',
          },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'company', 'message']

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}`, code: 'MISSING_FIELD' },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    // Format the contact submission
    const contactSubmission = {
      name: body.name,
      email: body.email,
      company: body.company,
      message: body.message,
      type: body.type || 'general',
      submittedAt: new Date().toISOString(),
    }

    // Send SNS notification
    await snsService.publishContactForm({
      name: contactSubmission.name,
      email: contactSubmission.email,
      company: contactSubmission.company,
      message: contactSubmission.message,
      formType: contactSubmission.type,
    })

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        email: contactSubmission.email,
      },
      { status: 200 }
    )
  } catch (error) {
    // Log structured error for monitoring
    const errorLog = {
      event: 'contact_submission_error',
      endpoint: '/api/contact',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }

    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(errorLog))
    } else {
      console.error('Contact submission error:', errorLog)
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
