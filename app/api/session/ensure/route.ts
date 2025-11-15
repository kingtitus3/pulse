import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAnonymousSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('pulse_session')?.value

    if (sessionId) {
      return NextResponse.json({ exists: true })
    }

    // Create new anonymous session
    const sessionData = await createAnonymousSession(req)

    const response = NextResponse.json({ created: true })

    // Set cookie
    response.cookies.set('pulse_session', sessionData.session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Failed to ensure session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

