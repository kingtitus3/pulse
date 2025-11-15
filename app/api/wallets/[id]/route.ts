import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const walletId = params.id
    const body = await req.json()
    const { label, isPrimary } = body

    // Verify ownership
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.userId !== sessionData.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}

    if (label !== undefined) {
      updateData.label = label || null
    }

    if (isPrimary === true) {
      // Unset other primary wallets
      await prisma.wallet.updateMany({
        where: {
          userId: sessionData.user.id,
          isPrimary: true,
        },
        data: { isPrimary: false },
      })
      updateData.isPrimary = true
    } else if (isPrimary === false) {
      updateData.isPrimary = false
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: updateData,
    })

    return NextResponse.json({
      id: updated.id,
      address: updated.address,
      addressTruncated: `${updated.address.substring(0, 4)}…${updated.address.substring(updated.address.length - 4)}`,
      label: updated.label,
      isPrimary: updated.isPrimary,
      resolvedHandle: updated.resolvedHandle,
      avatarUrl: updated.avatarUrl,
    })
  } catch (error) {
    logger.error('Failed to update wallet', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const walletId = params.id

    // Verify ownership
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.userId !== sessionData.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.wallet.delete({
      where: { id: walletId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete wallet', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

