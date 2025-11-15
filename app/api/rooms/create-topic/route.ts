import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import { createId } from '@paralleldrive/cuid2'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 1 topic per hour per session
    const rateLimitResult = await checkRateLimit(
      `topic:${sessionData.session.id}`,
      {
        limit: 1,
        windowSeconds: 3600,
      }
    )

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. One topic per hour.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { parentSlug, title, description } = body

    if (!parentSlug || !title) {
      return NextResponse.json(
        { error: 'Parent slug and title are required' },
        { status: 400 }
      )
    }

    // Validate title
    if (title.length < 10 || title.length > 70) {
      return NextResponse.json(
        { error: 'Title must be between 10 and 70 characters' },
        { status: 400 }
      )
    }

    // Check if all caps (shouting)
    if (title === title.toUpperCase() && title.length > 5) {
      return NextResponse.json(
        { error: 'Title cannot be all caps' },
        { status: 400 }
      )
    }

    // TODO: Profanity check

    // Get parent room
    const parentRoom = await prisma.room.findUnique({
      where: { slug: parentSlug },
    })

    if (!parentRoom) {
      return NextResponse.json({ error: 'Parent room not found' }, { status: 404 })
    }

    if (parentRoom.type !== 'core') {
      return NextResponse.json(
        { error: 'Parent must be a core room' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    const uniqueSlug = `${slug}-${createId().substring(0, 8)}`

    // Create topic room
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    const topicRoom = await prisma.room.create({
      data: {
        slug: uniqueSlug,
        type: 'topic',
        parentSlug: parentRoom.slug,
        shortName: title.substring(0, 30),
        title,
        category: parentRoom.category,
        description: description || null,
        archived: false,
        expiresAt,
        activityScore: 0,
      },
    })

    // Create system message
    const systemUser = await prisma.user.findFirst({
      where: { role: 'admin', displayName: 'System' },
    })

    if (systemUser) {
      await prisma.message.create({
        data: {
          roomId: topicRoom.id,
          userId: systemUser.id,
          type: 'system',
          content: `New topic created by ${sessionData.user.displayName}. Start discussing.`,
        },
      })
    }

    return NextResponse.json(topicRoom)
  } catch (error: any) {
    logger.error('Failed to create topic room', { error: error.message })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

