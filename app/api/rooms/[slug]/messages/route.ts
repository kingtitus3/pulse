import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { prisma } from '@/lib/prisma'

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

    let room: any = null
    let messages: any[] = []

    // Try Prisma first
    try {
      room = await prisma.room.findUnique({
        where: { slug },
      })
      console.log('[MESSAGES API] Prisma found room:', room?.id)
    } catch (prismaError: any) {
      console.warn('[MESSAGES API] Prisma failed, using Supabase:', prismaError.message)
    }

    // If Prisma failed or room not found, try Supabase
    if (!room) {
      try {
        const supabase = getSupabaseAdmin()
        const { data: roomData, error: roomError } = await supabase
          .from('Room')
          .select('*')
          .eq('slug', slug)
          .single()

        if (roomError || !roomData) {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 })
        }
        room = roomData
        console.log('[MESSAGES API] Supabase found room:', room.id)
      } catch (supabaseError: any) {
        console.error('[MESSAGES API] Supabase room lookup failed:', supabaseError.message)
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
    }

    // Get messages - try Prisma first
    try {
      const whereClause: any = {
        roomId: room.id,
        deletedAt: null,
      }
      
      // Pagination support - use cursor-based pagination with ID
      if (before) {
        whereClause.id = { lt: before }
      } else if (after) {
        whereClause.id = { gt: after }
      }

      messages = await prisma.message.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
            },
          },
        },
        orderBy: before
          ? { createdAt: 'desc' } // For loading older messages
          : after
          ? { createdAt: 'asc' } // For fetching specific message
          : { createdAt: 'desc' }, // Default: newest first
        take: limit,
      })
      
      // If loading older messages, reverse to maintain chronological order
      if (before) {
        messages.reverse()
      }
      
      console.log('[MESSAGES API] Prisma found', messages.length, 'messages')
    } catch (prismaError: any) {
      console.warn('[MESSAGES API] Prisma messages failed, using Supabase:', prismaError.message)
      
      // Fallback to Supabase
      try {
        const supabase = getSupabaseAdmin()
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
          throw messagesError
        }

        // Transform Supabase response to match Prisma format
        messages = (messagesData || []).map((msg: any) => ({
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
        
        console.log('[MESSAGES API] Supabase found', messages.length, 'messages')
      } catch (supabaseError: any) {
        console.error('[MESSAGES API] Supabase messages failed:', supabaseError.message)
        messages = []
      }
    }

    // Reverse to show oldest first
    messages.reverse()

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
    const { getSessionFromRequest } = await import('@/lib/session')
    const { checkRateLimit } = await import('@/lib/rateLimit')
    const { sanitizeMessage } = await import('@/lib/sanitize')

    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Get room
    const room = await prisma.room.findUnique({
      where: { slug },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check ban
    const ban = await prisma.ban.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: sessionData.user.id,
        },
      },
    })

    if (ban) {
      return NextResponse.json({ error: 'You are banned from this room' }, { status: 403 })
    }

    // Check slow mode (TODO: implement per-user tracking)
    // For now, rate limiting handles this

    // Validate message
    if (type === 'text') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
      }
    } else if (['sticker', 'gif', 'image'].includes(type)) {
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        return NextResponse.json({ error: 'Media URL is required' }, { status: 400 })
      }
      // TODO: Validate mediaUrl is from allowed domains
    } else {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        roomId: room.id,
        userId: sessionData.user.id,
        type,
        content: type === 'text' ? sanitizeMessage(content) : null,
        mediaUrl: type !== 'text' ? mediaUrl : null,
        width: width || null,
        height: height || null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    // Update room activity score
    await prisma.room.update({
      where: { id: room.id },
      data: {
        activityScore: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    logger.error('Failed to create message', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

