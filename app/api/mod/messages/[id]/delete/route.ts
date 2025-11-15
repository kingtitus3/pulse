import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const messageId = params.id

    // Soft delete
    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete message', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

