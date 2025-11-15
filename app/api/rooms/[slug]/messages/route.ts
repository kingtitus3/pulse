import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get room
    const room = await prisma.room.findUnique({
      where: { slug },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        roomId: room.id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Reverse to show oldest first
    messages.reverse()

    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Failed to get messages', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { getSessionFromRequest } = await import('@/lib/session')
    const { checkRateLimit } = await import('@/lib/rateLimit')
    const { sanitizeMessage } = await import('@/lib/sanitize')

    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slug = params.slug
    const body = await req.json()
    const { type = 'text', content, mediaUrl, width, height } = body

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`msg:${sessionData.session.id}`, {
      limit: 5,
      windowSeconds: 10,
    })

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get room
    const room = await prisma.room.findUnique({
      where: { slug },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check ban
    const ban = await prisma.ban.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: sessionData.user.id,
        },
      },
    })

    if (ban) {
      return NextResponse.json({ error: 'You are banned from this room' }, { status: 403 })
    }

    // Check slow mode (TODO: implement per-user tracking)
    // For now, rate limiting handles this

    // Validate message
    if (type === 'text') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
      }
    } else if (['sticker', 'gif', 'image'].includes(type)) {
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        return NextResponse.json({ error: 'Media URL is required' }, { status: 400 })
      }
      // TODO: Validate mediaUrl is from allowed domains
    } else {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        roomId: room.id,
        userId: sessionData.user.id,
        type,
        content: type === 'text' ? sanitizeMessage(content) : null,
        mediaUrl: type !== 'text' ? mediaUrl : null,
        width: width || null,
        height: height || null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    // Update room activity score
    await prisma.room.update({
      where: { id: room.id },
      data: {
        activityScore: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    logger.error('Failed to create message', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

