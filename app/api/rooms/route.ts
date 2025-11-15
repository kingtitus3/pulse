import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: any = {}
    if (!includeArchived) {
      where.archived = false
    }

    const orderBy: any = {}
    if (sort === 'activity') {
      orderBy.activityScore = 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy,
    })

    return NextResponse.json(rooms)
  } catch (error: any) {
    logger.error('Failed to get rooms', { error: error.message })
    // Return empty array if database connection fails
    if (
      error.message?.includes('connect') ||
      error.message?.includes('P1001') ||
      error.message?.includes('Can\'t reach database server') ||
      error.code === 'P1001'
    ) {
      return NextResponse.json([], { status: 200 })
    }
    // For other errors, still return empty array to prevent UI breakage
    return NextResponse.json([], { status: 200 })
  }
}

