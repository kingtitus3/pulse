import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { PrismaClient } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

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

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  if (!session) {
    return null
  }

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

export async function createAnonymousSession(
  req: NextRequest
): Promise<SessionData> {
  const prisma = new PrismaClient()

  // Generate random display name
  const randomNum = Math.floor(Math.random() * 1000)
  const displayName = `NeonDegen_${randomNum}`

  // Preset avatar IDs (simple numbered avatars)
  const avatarIds = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5']
  const avatar = avatarIds[Math.floor(Math.random() * avatarIds.length)]

  // Create user
  const user = await prisma.user.create({
    data: {
      displayName,
      avatar,
      isAnonymous: true,
      role: 'user',
    },
  })

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
}

