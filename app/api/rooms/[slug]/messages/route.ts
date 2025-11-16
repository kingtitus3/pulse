import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { pusherServer } from '@/lib/pusher'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100) // Max 100
    const before = searchParams.get('before') // For pagination
    const after = searchParams.get('after') // For fetching specific message

    console.log('[MESSAGES API] Fetching messages for room:', slug, { limit, before, after })

    const supabase = getSupabaseAdmin()

    // Get room
    const { data: roomData, error: roomError } = await supabase
      .from('Room')
      .select('*')
      .eq('slug', slug)
      .single()

    if (roomError || !roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const room = roomData
    console.log('[MESSAGES API] Found room:', room.id)

    // Get messages
    let query = supabase
      .from('Message')
      .select(`
        *,
        user:User!Message_userId_fkey (
          id,
          displayName,
          avatar
        )
      `)
      .eq('roomId', room.id)
      .is('deletedAt', null)

    // Pagination support
    if (before) {
      query = query.lt('id', before).order('createdAt', { ascending: false })
    } else if (after) {
      query = query.gt('id', after).order('createdAt', { ascending: true })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    const { data: messagesData, error: messagesError } = await query.limit(limit)

    if (messagesError) {
      console.error('[MESSAGES API] Supabase query error:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Transform Supabase response to match expected format
    const messages = (messagesData || []).map((msg: any) => ({
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.userId,
      type: msg.type,
      content: msg.content,
      mediaUrl: msg.mediaUrl,
      width: msg.width,
      height: msg.height,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      deletedAt: msg.deletedAt,
      user: msg.user || {
        id: msg.userId,
        displayName: 'Unknown',
        avatar: null,
      },
    }))

    // If loading older messages, reverse to maintain chronological order
    if (before) {
      messages.reverse()
    }

    // Reverse to show oldest first (only if not using 'after' for specific message fetch)
    if (!after) {
      messages.reverse()
    }

    console.log('[MESSAGES API] Returning', messages.length, 'messages')
    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('[MESSAGES API] Error:', error.message)
    logger.error('Failed to get messages', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { getSessionFromRequest, createAnonymousSession } = await import('@/lib/session')
    const { checkRateLimit } = await import('@/lib/rateLimit')
    const { sanitizeMessage } = await import('@/lib/sanitize')

    // Try to get existing session
    let sessionData = await getSessionFromRequest(req)

    // If no session exists, create one automatically
    if (!sessionData) {
      console.log('[MESSAGES POST] No session found, creating anonymous session...')
      try {
        sessionData = await createAnonymousSession(req)
        
        // Set cookie in response
        const response = NextResponse.json({ error: 'Session created, please retry' }, { status: 401 })
        response.cookies.set('pulse_session', sessionData.session.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        })
        return response
      } catch (sessionError: any) {
        console.error('[MESSAGES POST] Failed to create session:', {
          message: sessionError.message,
          stack: sessionError.stack,
        })
        return NextResponse.json({ 
          error: 'Failed to create session',
          details: sessionError.message 
        }, { status: 500 })
      }
    }

    const slug = params.slug
    const body = await req.json()
    const { type = 'text', content, mediaUrl, width, height } = body

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`msg:${sessionData.session.id}`, {
      limit: 5,
      windowSeconds: 10,
    })

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get room
    const { data: roomData, error: roomError } = await supabase
      .from('Room')
      .select('*')
      .eq('slug', slug)
      .single()

    if (roomError || !roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const room = roomData

    // Check ban
    const { data: banData } = await supabase
      .from('Ban')
      .select('*')
      .eq('roomId', room.id)
      .eq('userId', sessionData.user.id)
      .single()

    if (banData) {
      return NextResponse.json({ error: 'You are banned from this room' }, { status: 403 })
    }

    // Validate message
    if (type === 'text') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
      }
    } else if (['sticker', 'gif', 'image'].includes(type)) {
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        return NextResponse.json({ error: 'Media URL is required' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Create message
    const { data: messageData, error: messageError } = await supabase
      .from('Message')
      .insert({
        roomId: room.id,
        userId: sessionData.user.id,
        type,
        content: type === 'text' ? sanitizeMessage(content) : null,
        mediaUrl: type !== 'text' ? mediaUrl : null,
        width: width || null,
        height: height || null,
      })
      .select(`
        *,
        user:User!Message_userId_fkey (
          id,
          displayName,
          avatar
        )
      `)
      .single()

    if (messageError || !messageData) {
      console.error('[MESSAGES POST] Failed to create message:', messageError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Update room activity score
    await supabase
      .from('Room')
      .update({ activityScore: room.activityScore + 1 })
      .eq('id', room.id)

    // Transform to match expected format
    const message = {
      id: messageData.id,
      roomId: messageData.roomId,
      userId: messageData.userId,
      type: messageData.type,
      content: messageData.content,
      mediaUrl: messageData.mediaUrl,
      width: messageData.width,
      height: messageData.height,
      createdAt: messageData.createdAt,
      updatedAt: messageData.updatedAt,
      deletedAt: messageData.deletedAt,
      user: messageData.user || {
        id: messageData.userId,
        displayName: 'Unknown',
        avatar: null,
      },
    }

    return NextResponse.json(message)
  } catch (error) {
    logger.error('Failed to create message', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
