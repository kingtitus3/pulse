import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { stickerId } = body

    if (!stickerId) {
      return NextResponse.json({ error: 'Sticker ID is required' }, { status: 400 })
    }

    // Get sticker
    const sticker = await prisma.sticker.findUnique({
      where: { id: stickerId },
      include: { pack: true },
    })

    if (!sticker) {
      return NextResponse.json({ error: 'Sticker not found' }, { status: 404 })
    }

    // Update stats in transaction
    await prisma.$transaction([
      // Update sticker stats
      prisma.sticker.update({
        where: { id: stickerId },
        data: {
          totalUses: { increment: 1 },
          recentUses: { increment: 1 },
        },
      }),
      // Update pack stats
      prisma.stickerPack.update({
        where: { id: sticker.packId },
        data: {
          totalUses: { increment: 1 },
          recentUses: { increment: 1 },
          lastUsedAt: new Date(),
        },
      }),
      // Update user stats
      prisma.userStickerStats.upsert({
        where: {
          userId_packId: {
            userId: sessionData.user.id,
            packId: sticker.packId,
          },
        },
        update: {
          totalUses: { increment: 1 },
          lastUsedAt: new Date(),
        },
        create: {
          userId: sessionData.user.id,
          packId: sticker.packId,
          totalUses: 1,
          lastUsedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to record sticker use', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

