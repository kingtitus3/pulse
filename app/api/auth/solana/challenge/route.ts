import { NextRequest, NextResponse } from 'next/server'
import { createId } from '@paralleldrive/cuid2'
import { isValidSolanaAddress } from '@/lib/wallets'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const address = typeof body.address === 'string' ? body.address : ''

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    if (!isValidSolanaAddress(address)) {
      return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      )
    }

    const nonce = createId()

    const message = [
      'Pulse Chat Login',
      '',
      `Address: ${address}`,
      `Nonce: ${nonce}`,
      '',
      'This message is used to verify ownership of your wallet for Pulse Chat.',
      'It will not trigger any transactions or gas fees.',
    ].join('\n')

    // Persist challenge so we can prevent replay
    const now = new Date()
    const cutoff = new Date(now.getTime() - 15 * 60 * 1000).toISOString() // 15 minutes

    // Best-effort cleanup of old challenges for this address
    await supabase
      .from('WalletChallenge')
      .delete()
      .eq('address', address)
      .lt('createdAt', cutoff)

    const challengeId = createId()
    const { error: insertError } = await supabase.from('WalletChallenge').insert({
      id: challengeId,
      address,
      nonce,
    })

    if (insertError) {
      console.error('[AUTH_SOLANA_CHALLENGE] Failed to persist challenge:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate challenge' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message, nonce })
  } catch (error: any) {
    console.error('[AUTH_SOLANA_CHALLENGE] Unexpected error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



