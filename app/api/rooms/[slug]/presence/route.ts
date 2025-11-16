import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { getSessionFromRequest } = await import('@/lib/session')

    const sessionData = await getSessionFromRequest(req)
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const slug = params.slug

    // Get room ID from slug
    const { data: room, error: roomError } = await supabase
      .from('Room')
      .select('id')
      .eq('slug', slug)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // Upsert presence record for this user+room
    // Table expected:
    // RoomPresence(id TEXT, roomId TEXT, userId TEXT, lastSeenAt TIMESTAMP)
    const { error: presenceError } = await supabase
      .from('RoomPresence')
      .upsert(
        {
          id: `${room.id}:${sessionData.user.id}`,
          roomId: room.id,
          userId: sessionData.user.id,
          lastSeenAt: now,
        },
        { onConflict: 'id' }
      )

    if (presenceError) {
      console.error('[PRESENCE] Failed to upsert presence:', presenceError)
      // Don't break chat – just return success but log the error
      return NextResponse.json({ ok: false, error: presenceError.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true, lastSeenAt: now })
  } catch (error: any) {
    console.error('[PRESENCE] Error:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
  }
}


