import { creditVisibilityCookie } from '@/lib/core'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const preference = await creditVisibilityCookie.get()
  return NextResponse.json(preference)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { showCredits } = body

    if (typeof showCredits !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid showCredits value' },
        { status: 400 }
      )
    }

    await creditVisibilityCookie.set({ showCredits })
    return NextResponse.json({ success: true, showCredits })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update credit visibility preference' },
      { status: 500 }
    )
  }
}
