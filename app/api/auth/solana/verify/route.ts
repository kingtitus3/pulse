import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createId } from '@paralleldrive/cuid2'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { getSessionFromRequest } from '@/lib/session'
import { isValidSolanaAddress, verifyWalletOwnership } from '@/lib/wallets'

function parseChallengeMessage(message: string) {
  const lines = message.split('\n')
  const title = lines[0] || ''
  const addressLine = lines.find((l) => l.startsWith('Address: '))
  const nonceLine = lines.find((l) => l.startsWith('Nonce: '))

  if (title !== 'Pulse Chat Login' || !addressLine || !nonceLine) {
    return { ok: false as const, error: 'Invalid challenge message format' }
  }

  const addressInMessage = addressLine.slice('Address: '.length).trim()
  const nonce = nonceLine.slice('Nonce: '.length).trim()

  if (!addressInMessage || !nonce) {
    return { ok: false as const, error: 'Invalid challenge message contents' }
  }

  return { ok: true as const, addressInMessage, nonce }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const address = typeof body.address === 'string' ? body.address : ''
    const signature = typeof body.signature === 'string' ? body.signature : ''
    const message = typeof body.message === 'string' ? body.message : ''

    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: 'address, signature, and message are required' },
        { status: 400 }
      )
    }

    if (!isValidSolanaAddress(address)) {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 })
    }

    const parsed = parseChallengeMessage(message)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    if (parsed.addressInMessage !== address) {
      return NextResponse.json(
        { error: 'Challenge address does not match provided address' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      )
    }

    // Require a fresh, unused challenge for this address + nonce
    const challengeCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    const { data: challenge, error: challengeError } = await supabase
      .from('WalletChallenge')
      .select('*')
      .eq('address', address)
      .eq('nonce', parsed.nonce)
      .is('usedAt', null)
      .gt('createdAt', challengeCutoff)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (challengeError) {
      console.error('[AUTH_SOLANA_VERIFY] Failed to load challenge:', challengeError)
      return NextResponse.json({ error: 'Failed to verify challenge' }, { status: 500 })
    }

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found, expired, or already used' },
        { status: 400 }
      )
    }

    const ownsWallet = await verifyWalletOwnership(address, signature, message)
    if (!ownsWallet) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Mark the challenge as used so it cannot be replayed
    const { error: markUsedError } = await supabase
      .from('WalletChallenge')
      .update({ usedAt: new Date().toISOString() })
      .eq('id', challenge.id)

    if (markUsedError) {
      console.error('[AUTH_SOLANA_VERIFY] Failed to mark challenge used:', markUsedError)
      // Non-fatal for the current login, but it weakens replay protection, so log loudly
    }

    // Try to get existing session (anonymous or otherwise)
    const sessionData = await getSessionFromRequest(req)

    // Check if this wallet already exists
    const { data: existingWallet, error: walletLookupError } = await supabase
      .from('Wallet')
      .select('*')
      .eq('address', address)
      .maybeSingle()

    if (walletLookupError) {
      console.error('[AUTH_SOLANA_VERIFY] Wallet lookup error:', walletLookupError)
      return NextResponse.json({ error: 'Failed to look up wallet' }, { status: 500 })
    }

    let userId: string

    if (existingWallet) {
      // Wallet already linked to a user – that user becomes canonical for this address
      userId = existingWallet.userId
    } else if (sessionData) {
      // No existing wallet for this address; link it to current session user
      userId = sessionData.user.id
    } else {
      // No session and no wallet – create a new user
      const userIdGenerated = createId()
      const shortAddr =
        address.length > 10
          ? `${address.slice(0, 4)}…${address.slice(address.length - 4)}`
          : address

      const displayName = `Wallet_${shortAddr}`

      const { data: newUser, error: userError } = await supabase
        .from('User')
        .insert({
          id: userIdGenerated,
          displayName,
          avatar: 'avatar-1',
          isAnonymous: false,
          role: 'user',
          tags: [],
          showWallets: true,
        })
        .select()
        .single()

      if (userError || !newUser) {
        console.error('[AUTH_SOLANA_VERIFY] Failed to create user:', {
          message: userError?.message,
          code: userError?.code,
          details: userError?.details,
          hint: userError?.hint,
        })
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      userId = newUser.id
    }

    // Ensure wallet row exists and is linked to userId
    let walletUserId = userId
    if (!existingWallet) {
      // Check if this user already has any primary wallet
      const { data: primaryWallet, error: primaryError } = await supabase
        .from('Wallet')
        .select('id')
        .eq('userId', userId)
        .eq('isPrimary', true)
        .maybeSingle()

      if (primaryError) {
        console.error('[AUTH_SOLANA_VERIFY] Primary wallet lookup error:', primaryError)
      }

      const { error: insertError } = await supabase.from('Wallet').insert({
        id: createId(),
        userId,
        address,
        isPrimary: !primaryWallet,
      })

      if (insertError) {
        console.error('[AUTH_SOLANA_VERIFY] Failed to insert wallet:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        })

        // 23505 = unique_violation in Postgres – likely wallet address already linked
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'This wallet address is already linked to another account.' },
            { status: 400 }
          )
        }

        return NextResponse.json({ error: 'Failed to link wallet' }, { status: 500 })
      }
    } else {
      walletUserId = existingWallet.userId
    }

    // Ensure we have a session pointing at walletUserId
    const cookieStore = await cookies()
    const existingSessionId = cookieStore.get('pulse_session')?.value

    let sessionId = existingSessionId

    if (existingSessionId && sessionData) {
      // Update existing session to point at walletUserId if needed
      if (sessionData.session.userId !== walletUserId) {
        const { error: updateSessionError } = await supabase
          .from('Session')
          .update({ userId: walletUserId })
          .eq('id', existingSessionId)

        if (updateSessionError) {
          console.error('[AUTH_SOLANA_VERIFY] Failed to update session:', {
            message: updateSessionError.message,
            code: updateSessionError.code,
            details: updateSessionError.details,
            hint: updateSessionError.hint,
          })
        }
      }
    } else {
      // Create a brand new session
      sessionId = createId()

      let ipHash: string | null = null
      const ip =
        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      if (ip && process.env.PULSE_SESSION_SECRET) {
        const crypto = await import('crypto')
        const hash = crypto
          .createHash('sha256')
          .update(ip + process.env.PULSE_SESSION_SECRET)
          .digest('hex')
        ipHash = hash.substring(0, 16)
      }

      const now = new Date().toISOString()
      const { error: sessionInsertError } = await supabase.from('Session').insert({
        id: sessionId,
        userId: walletUserId,
        ipHash,
        lastSeenAt: now,
      })

      if (sessionInsertError) {
        console.error('[AUTH_SOLANA_VERIFY] Failed to create session:', {
          message: sessionInsertError.message,
          code: sessionInsertError.code,
          details: sessionInsertError.details,
          hint: sessionInsertError.hint,
        })
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        )
      }
    }

    // Load fresh user + wallets to return
    const { data: userRow, error: userFetchError } = await supabase
      .from('User')
      .select(
        'id, displayName, avatar, bio, tags, showWallets, role, isAnonymous'
      )
      .eq('id', walletUserId)
      .single()

    if (userFetchError || !userRow) {
      console.error('[AUTH_SOLANA_VERIFY] Failed to fetch user:', userFetchError)
      return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
    }

    const { data: walletsData, error: walletsError } = await supabase
      .from('Wallet')
      .select('*')
      .eq('userId', walletUserId)
      .order('isPrimary', { ascending: false })
      .order('createdAt', { ascending: true })

    if (walletsError) {
      console.error('[AUTH_SOLANA_VERIFY] Failed to fetch wallets:', walletsError)
      return NextResponse.json({ error: 'Failed to load wallets' }, { status: 500 })
    }

    const wallets = (walletsData || []).map((w: any) => ({
      id: w.id,
      address: w.address,
      addressTruncated:
        w.address && w.address.length > 8
          ? `${w.address.substring(0, 4)}…${w.address.substring(
              w.address.length - 4
            )}`
          : w.address,
      label: w.label,
      isPrimary: w.isPrimary,
      resolvedHandle: w.resolvedHandle,
      avatarUrl: w.avatarUrl,
    }))

    const response = NextResponse.json({
      user: {
        id: userRow.id,
        displayName: userRow.displayName,
        avatar: userRow.avatar,
        bio: userRow.bio,
        tags: userRow.tags || [],
        showWallets: userRow.showWallets,
        role: userRow.role,
        isAnonymous: userRow.isAnonymous,
      },
      wallets,
    })

    if (sessionId) {
      response.cookies.set('pulse_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error: any) {
    console.error('[AUTH_SOLANA_VERIFY] Unexpected error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


