import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only include wallets if user.showWallets is true
    const wallets = user.showWallets
      ? user.wallets.map((w) => ({
          id: w.id,
          address: w.address,
          addressTruncated: `${w.address.substring(0, 4)}…${w.address.substring(w.address.length - 4)}`,
          label: w.label,
          isPrimary: w.isPrimary,
          resolvedHandle: w.resolvedHandle,
          avatarUrl: w.avatarUrl,
        }))
      : []

    return NextResponse.json({
      id: user.id,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      tags: user.tags,
      wallets,
      createdAt: user.createdAt,
    })
  } catch (error) {
    logger.error('Failed to get user profile', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

