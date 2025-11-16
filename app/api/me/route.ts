import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wallets for user (using Supabase)
    const supabase = getSupabaseAdmin()
    const { data: walletsData } = await supabase
      .from('Wallet')
      .select('*')
      .eq('userId', sessionData.user.id)
      .order('isPrimary', { ascending: false })
      .order('createdAt', { ascending: true })

    const wallets = walletsData || []

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        displayName: sessionData.user.displayName,
        avatar: sessionData.user.avatar,
        bio: sessionData.user.bio,
        tags: sessionData.user.tags,
        showWallets: sessionData.user.showWallets,
        role: sessionData.user.role,
        isAnonymous: sessionData.user.isAnonymous,
      },
      wallets: wallets.map((w) => ({
        id: w.id,
        address: w.address,
        addressTruncated: `${w.address.substring(0, 4)}…${w.address.substring(w.address.length - 4)}`,
        label: w.label,
        isPrimary: w.isPrimary,
        resolvedHandle: w.resolvedHandle,
        avatarUrl: w.avatarUrl,
      })),
    })
  } catch (error: any) {
    logger.error('Failed to get user', { error: error.message })
    // Return 401 if database connection fails (user needs to set up DB)
    if (error.message?.includes('connect') || error.message?.includes('P1001')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { displayName, avatar, bio, tags, showWallets } = body

    const updateData: any = {}

    if (displayName !== undefined) {
      const { sanitizeDisplayName } = await import('@/lib/sanitize')
      updateData.displayName = sanitizeDisplayName(displayName)
    }

    if (avatar !== undefined) {
      updateData.avatar = String(avatar)
    }

    if (bio !== undefined) {
      if (bio === null || bio === '') {
        updateData.bio = null
      } else {
        const { sanitizeBio } = await import('@/lib/sanitize')
        updateData.bio = sanitizeBio(bio)
      }
    }

    if (tags !== undefined) {
      // Validate tags: array of strings, max 8, each max 20 chars
      if (Array.isArray(tags) && tags.length <= 8) {
        const sanitizedTags = tags
          .slice(0, 8)
          .map((tag: string) => String(tag).substring(0, 20))
          .filter((tag: string) => tag.length > 0)
        updateData.tags = sanitizedTags
      }
    }

    if (showWallets !== undefined) {
      updateData.showWallets = Boolean(showWallets)
    }

    // Update user using Supabase
    const supabase = getSupabaseAdmin()
    const { data: updatedUserData, error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', sessionData.user.id)
      .select()
      .single()

    if (updateError || !updatedUserData) {
      throw new Error(updateError?.message || 'Failed to update user')
    }

    const updatedUser = updatedUserData

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        tags: updatedUser.tags,
        showWallets: updatedUser.showWallets,
        role: updatedUser.role,
        isAnonymous: updatedUser.isAnonymous,
      },
    })
  } catch (error: any) {
    logger.error('Failed to update user', { error: error.message })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    )
  }
}

