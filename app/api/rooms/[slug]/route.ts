import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Use Supabase directly (more reliable in serverless)
    const supabase = getSupabaseAdmin()
    const { data: room, error } = await supabase
      .from('Room')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !room) {
      console.error('[ROOM API] Room not found:', slug, error)
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error: any) {
    console.error('[ROOM API] Error:', error.message)
    logger.error('Failed to get room', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

