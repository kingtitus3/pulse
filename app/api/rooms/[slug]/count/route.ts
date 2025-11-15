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
      return NextResponse.json({ count: 0 })
    }

    // Count distinct users who have sent messages in this room recently
    // This is a proxy for "online users" - in production you'd use Presence
    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('userId')
      .eq('roomId', room.id)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false })
      .limit(100)

    if (messagesError) {
      return NextResponse.json({ count: 0 })
    }

    // Count unique users
    const uniqueUserIds = new Set()
    messages?.forEach((msg: any) => {
      if (msg.userId) {
        uniqueUserIds.add(msg.userId)
      }
    })

    return NextResponse.json({ count: uniqueUserIds.size })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}

