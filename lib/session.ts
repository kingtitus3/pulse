import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { getSupabaseAdmin } from './supabaseClient'

const prisma = new PrismaClient()

export interface SessionData {
  session: {
    id: string
    userId: string
    ipHash: string | null
    createdAt: Date
    lastSeenAt: Date
  }
  user: {
    id: string
    displayName: string
    avatar: string
    isAnonymous: boolean
    role: string
    bio: string | null
    tags: string[]
    showWallets: boolean
    createdAt: Date
  }
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('pulse_session')?.value

  if (!sessionId) {
    return null
  }

  // Try Prisma first
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })

    if (session) {
      // Update lastSeenAt
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastSeenAt: new Date() },
      })

      return {
        session: {
          id: session.id,
          userId: session.userId,
          ipHash: session.ipHash,
          createdAt: session.createdAt,
          lastSeenAt: session.lastSeenAt,
        },
        user: {
          id: session.user.id,
          displayName: session.user.displayName,
          avatar: session.user.avatar,
          isAnonymous: session.user.isAnonymous,
          role: session.user.role,
          bio: session.user.bio,
          tags: session.user.tags,
          showWallets: session.user.showWallets,
          createdAt: session.user.createdAt,
        },
      }
    }
  } catch (prismaError: any) {
    console.warn('[SESSION] Prisma failed, trying Supabase:', prismaError.message)
  }

  // Fallback to Supabase
  try {
    const supabase = getSupabaseAdmin()
    const { data: sessionData, error: sessionError } = await supabase
      .from('Session')
      .select(`
        *,
        user:User!Session_userId_fkey (
          id,
          displayName,
          avatar,
          isAnonymous,
          role,
          bio,
          tags,
          showWallets,
          createdAt
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !sessionData) {
      return null
    }

    // Update lastSeenAt
    await supabase
      .from('Session')
      .update({ lastSeenAt: new Date().toISOString() })
      .eq('id', sessionId)

    return {
      session: {
        id: sessionData.id,
        userId: sessionData.userId,
        ipHash: sessionData.ipHash,
        createdAt: new Date(sessionData.createdAt),
        lastSeenAt: new Date(sessionData.lastSeenAt),
      },
      user: {
        id: sessionData.user.id,
        displayName: sessionData.user.displayName,
        avatar: sessionData.user.avatar,
        isAnonymous: sessionData.user.isAnonymous,
        role: sessionData.user.role,
        bio: sessionData.user.bio,
        tags: sessionData.user.tags || [],
        showWallets: sessionData.user.showWallets,
        createdAt: new Date(sessionData.user.createdAt),
      },
    }
  } catch (supabaseError: any) {
    console.error('[SESSION] Supabase failed:', supabaseError.message)
    return null
  }
}

export async function createAnonymousSession(
  req: NextRequest
): Promise<SessionData> {
  // Generate random display name
  const randomNum = Math.floor(Math.random() * 1000)
  const displayName = `NeonDegen_${randomNum}`

  // Preset avatar IDs (simple numbered avatars)
  const avatarIds = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5']
  const avatar = avatarIds[Math.floor(Math.random() * avatarIds.length)]

  // Hash IP if available (optional)
  let ipHash: string | null = null
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  if (ip && process.env.PULSE_SESSION_SECRET) {
    const crypto = await import('crypto')
    const hash = crypto
      .createHash('sha256')
      .update(ip + process.env.PULSE_SESSION_SECRET)
      .digest('hex')
    ipHash = hash.substring(0, 16) // Truncate to 16 chars
  }

  // Try Prisma first
  try {
    // Create user
    const user = await prisma.user.create({
      data: {
        displayName,
        avatar,
        isAnonymous: true,
        role: 'user',
      },
    })

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        ipHash,
      },
    })

    return {
      session: {
        id: session.id,
        userId: session.userId,
        ipHash: session.ipHash,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
      },
      user: {
        id: user.id,
        displayName: user.displayName,
        avatar: user.avatar,
        isAnonymous: user.isAnonymous,
        role: user.role,
        bio: user.bio,
        tags: user.tags,
        showWallets: user.showWallets,
        createdAt: user.createdAt,
      },
    }
  } catch (prismaError: any) {
    console.warn('[SESSION] Prisma failed, using Supabase:', prismaError.message)
  }

  // Fallback to Supabase
  try {
    const supabase = getSupabaseAdmin()
    
    // Create user
    const { data: userData, error: userError } = await supabase
      .from('User')
      .insert({
        displayName,
        avatar,
        isAnonymous: true,
        role: 'user',
        tags: [],
        showWallets: false,
      })
      .select()
      .single()

    if (userError || !userData) {
      throw new Error(`Failed to create user: ${userError?.message || 'Unknown error'}`)
    }

    // Create session
    const { data: sessionData, error: sessionError } = await supabase
      .from('Session')
      .insert({
        userId: userData.id,
        ipHash,
      })
      .select()
      .single()

    if (sessionError || !sessionData) {
      throw new Error(`Failed to create session: ${sessionError?.message || 'Unknown error'}`)
    }

    return {
      session: {
        id: sessionData.id,
        userId: sessionData.userId,
        ipHash: sessionData.ipHash,
        createdAt: new Date(sessionData.createdAt),
        lastSeenAt: new Date(sessionData.lastSeenAt),
      },
      user: {
        id: userData.id,
        displayName: userData.displayName,
        avatar: userData.avatar,
        isAnonymous: userData.isAnonymous,
        role: userData.role,
        bio: userData.bio,
        tags: userData.tags || [],
        showWallets: userData.showWallets,
        createdAt: new Date(userData.createdAt),
      },
    }
  } catch (supabaseError: any) {
    console.error('[SESSION] Supabase creation failed:', supabaseError.message)
    throw new Error(`Failed to create session: ${supabaseError.message}`)
  }
}
