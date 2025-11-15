import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    console.log('[ROOMS API] Incoming request:', {
      sort,
      includeArchived,
    })

    const supabase = getSupabaseAdmin()

    // Build Supabase query (same pattern as /api/rooms/test and /api/debug/rooms)
    let query = supabase.from('Room').select('*')

    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    if (sort === 'activity') {
      query = query.order('activityScore', { ascending: false })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('[ROOMS API] Supabase error:', {
        code: error.code,
        message: error.message,
        details: error,
      })
      // On error, log and return empty array (frontend can show friendly message)
      return NextResponse.json([], {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    const rooms = Array.isArray(data) ? data : []

    console.log('[ROOMS API] Supabase returned rooms:', {
      count: rooms.length,
      slugs: rooms.map((r: any) => r.slug),
    })

    return NextResponse.json(rooms, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[ROOMS API] Unexpected error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    logger.error('Failed to get rooms', { error: error.message, code: error.code })

    // For safety, return empty array to avoid breaking the UI
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }
}

