import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packId = params.id

    const pack = await prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
    }

    return NextResponse.json(pack)
  } catch (error) {
    logger.error('Failed to get sticker pack', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

