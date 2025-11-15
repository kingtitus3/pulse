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

    // Get distinct users who have sent messages in this room (as a proxy for "online")
    // In a real implementation, you'd use Supabase Presence or a separate online_users table
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('userId, user:User!Message_userId_fkey(id, displayName, avatar)')
      .eq('roomId', room.id)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })
      .limit(100) // Get recent messages to find active users

    if (messagesError) {
      console.error('[ROOM USERS API] Error fetching messages:', messagesError)
      return NextResponse.json({ users: [], count: 0 })
    }

    // Get unique users from recent messages
    const uniqueUsers = new Map()
    messages?.forEach((msg: any) => {
      if (msg.user && msg.userId && !uniqueUsers.has(msg.userId)) {
        uniqueUsers.set(msg.userId, {
          id: msg.user.id || msg.userId,
          displayName: msg.user.displayName || 'Unknown',
          avatar: msg.user.avatar || null,
        })
      }
    })

    const users = Array.from(uniqueUsers.values())

    return NextResponse.json({
      users,
      count: users.length,
    })
  } catch (error: any) {
    console.error('[ROOM USERS API] Error:', error.message)
    return NextResponse.json({ users: [], count: 0 })
  }
}

