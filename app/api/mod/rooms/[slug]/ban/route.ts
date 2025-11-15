import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is mod or admin
    if (!['mod', 'admin'].includes(sessionData.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const slug = params.slug
    const body = await req.json()
    const { userId, reason } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get room
    const room = await prisma.room.findUnique({
      where: { slug },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Create or update ban
    const ban = await prisma.ban.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId,
        },
      },
      update: {
        reason: reason || null,
      },
      create: {
        roomId: room.id,
        userId,
        reason: reason || null,
      },
    })

    return NextResponse.json({ success: true, id: ban.id })
  } catch (error) {
    logger.error('Failed to ban user', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

