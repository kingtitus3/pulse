import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { isValidSolanaAddress } from '@/lib/wallets'
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
    const { address, label } = body

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Validate Solana address
    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address' },
        { status: 400 }
      )
    }

    // Check if wallet already exists for this user
    const existing = await prisma.wallet.findFirst({
      where: {
        userId: sessionData.user.id,
        address,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Wallet already linked' },
        { status: 400 }
      )
    }

    // Check if user has any primary wallet
    const hasPrimary = await prisma.wallet.findFirst({
      where: {
        userId: sessionData.user.id,
        isPrimary: true,
      },
    })

    const wallet = await prisma.wallet.create({
      data: {
        userId: sessionData.user.id,
        address,
        label: label || null,
        isPrimary: !hasPrimary, // Set as primary if user has no primary wallet
      },
    })

    // TODO: Verify wallet ownership via signed message
    // For now, we trust the client (not recommended for production)

    return NextResponse.json({
      id: wallet.id,
      address: wallet.address,
      addressTruncated: `${wallet.address.substring(0, 4)}…${wallet.address.substring(wallet.address.length - 4)}`,
      label: wallet.label,
      isPrimary: wallet.isPrimary,
      resolvedHandle: wallet.resolvedHandle,
      avatarUrl: wallet.avatarUrl,
    })
  } catch (error) {
    logger.error('Failed to link wallet', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

