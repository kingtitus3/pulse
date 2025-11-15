import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimit'
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

    const messageId = params.id
    const body = await req.json()
    const { reason } = body

    // Rate limiting: 5 reports per hour
    const rateLimitResult = await checkRateLimit(
      `report:${sessionData.session.id}`,
      {
        limit: 5,
        windowSeconds: 3600,
      }
    )

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check if already reported by this user
    const existingReport = await prisma.report.findFirst({
      where: {
        messageId,
        reporterId: sessionData.user.id,
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Already reported' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        messageId,
        reporterId: sessionData.user.id,
        reason: reason || null,
      },
    })

    return NextResponse.json({ success: true, id: report.id })
  } catch (error) {
    logger.error('Failed to create report', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

