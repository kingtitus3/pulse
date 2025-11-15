import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { getSessionFromRequest } = await import('@/lib/session')
    const sessionData = await getSessionFromRequest(req)

    const userId = sessionData?.user.id

    // Get recent packs (by lastUsedAt)
    const recentPacks = await prisma.stickerPack.findMany({
      where: {
        lastUsedAt: { not: null },
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
      take: 10,
      include: {
        stickers: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Get favorite packs (if user is logged in)
    let favoritePacks: any[] = []
    if (userId) {
      const userStats = await prisma.userStickerStats.findMany({
        where: {
          userId,
          favorite: true,
        },
        include: {
          pack: {
            include: {
              stickers: {
                take: 1,
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
        orderBy: {
          lastUsedAt: 'desc',
        },
        take: 10,
      })
      favoritePacks = userStats.map((stat) => stat.pack)
    }

    // Get trending packs (by recentUses)
    const trendingPacks = await prisma.stickerPack.findMany({
      orderBy: {
        recentUses: 'desc',
      },
      take: 10,
      include: {
        stickers: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Get packs by kind
    const byKind: Record<string, any[]> = {}
    const kinds = ['reaction', 'meme', 'character', 'chain', 'brand', 'other']

    for (const kind of kinds) {
      const packs = await prisma.stickerPack.findMany({
        where: { kind },
        orderBy: { totalUses: 'desc' },
        take: 10,
        include: {
          stickers: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      })
      byKind[kind] = packs
    }

    return NextResponse.json({
      recents: recentPacks,
      favorites: favoritePacks,
      trending: trendingPacks,
      byKind,
    })
  } catch (error) {
    logger.error('Failed to get sticker overview', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

