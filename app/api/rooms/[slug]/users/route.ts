import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const supabase = getSupabaseAdmin()

    // Get room
    const { data: room, error: roomError } = await supabase
      .from('Room')
      .select('id')
      .eq('slug', slug)
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // NEW: Use presence table instead of recent messages
    const now = new Date()
    const cutoff = new Date(now.getTime() - 30 * 1000).toISOString() // last 30 seconds

    // 1) Get presence rows for this room in last 30s
    const { data: presenceRows, error: presenceError } = await supabase
      .from('RoomPresence')
      .select('userId, lastSeenAt')
      .eq('roomId', room.id)
      .gte('lastSeenAt', cutoff)

    if (presenceError) {
      console.error('[ROOM USERS API] Error fetching presence:', presenceError)
      return NextResponse.json({ users: [], count: 0 })
    }

    if (!presenceRows || presenceRows.length === 0) {
      return NextResponse.json({ users: [], count: 0 })
    }

    // 2) Get unique user IDs
    const userIds = Array.from(
      new Set(presenceRows.map((row: any) => row.userId).filter(Boolean))
    )

    if (userIds.length === 0) {
      return NextResponse.json({ users: [], count: 0 })
    }

    // 3) Fetch users for those IDs
    const { data: usersData, error: usersError } = await supabase
      .from('User')
      .select('id, displayName, avatar')
      .in('id', userIds)

    if (usersError) {
      console.error('[ROOM USERS API] Error fetching users:', usersError)
      return NextResponse.json({ users: [], count: 0 })
    }

    const users =
      usersData?.map((u: any) => ({
        id: u.id,
        displayName: u.displayName || 'Unknown',
        avatar: u.avatar || null,
      })) || []

    return NextResponse.json({
      users,
      count: users.length,
    })
  } catch (error: any) {
    console.error('[ROOM USERS API] Error:', error.message)
    return NextResponse.json({ users: [], count: 0 })
  }
}

