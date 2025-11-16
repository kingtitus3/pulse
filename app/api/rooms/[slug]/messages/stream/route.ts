import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

// Server-Sent Events endpoint for real-time message streaming
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const supabase = getSupabaseAdmin()

  // Get room
  const { data: roomData, error: roomError } = await supabase
    .from('Room')
    .select('*')
    .eq('slug', slug)
    .single()

  if (roomError || !roomData) {
    return new Response('Room not found', { status: 404 })
  }

  const room = roomData
  let lastMessageId: string | null = null

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      // Poll for new messages every 500ms
      const pollInterval = setInterval(async () => {
        try {
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
            .order('createdAt', { ascending: false })
            .limit(10)

          if (lastMessageId) {
            query = query.gt('id', lastMessageId)
          }

          const { data: messages, error } = await query

          if (error) {
            console.error('[SSE] Error fetching messages:', error)
            return
          }

          if (messages && messages.length > 0) {
            // Update last message ID
            lastMessageId = messages[messages.length - 1].id

            // Transform messages
            const transformedMessages = messages.map((msg: any) => ({
              id: msg.id,
              roomId: msg.roomId,
              userId: msg.userId,
              type: msg.type,
              content: msg.content,
              mediaUrl: msg.mediaUrl,
              width: msg.width,
              height: msg.height,
              createdAt: msg.createdAt,
              user: msg.user || {
                id: msg.userId,
                displayName: 'Unknown',
                avatar: null,
              },
            }))

            // Send new messages via SSE
            for (const message of transformedMessages.reverse()) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'message', message })}\n\n`)
              )
            }
          }
        } catch (err) {
          console.error('[SSE] Polling error:', err)
        }
      }, 500) // Poll every 500ms for near-instant updates

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

