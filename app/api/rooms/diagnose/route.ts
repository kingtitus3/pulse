import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 20) || 'NOT SET',
    },
    supabase: {
      connected: false,
      error: null,
      roomCount: 0,
      rooms: [],
    },
  }

  try {
    const supabase = getSupabaseAdmin()
    diagnostics.supabase.connected = true

    // Try to fetch rooms
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .limit(20)

    if (error) {
      diagnostics.supabase.error = {
        code: error.code,
        message: error.message,
        details: error,
      }
    } else {
      diagnostics.supabase.roomCount = data?.length || 0
      diagnostics.supabase.rooms = (data || []).map((r: any) => ({
        id: r.id,
        slug: r.slug,
        shortName: r.shortName,
        title: r.title,
        type: r.type,
        archived: r.archived,
      }))
    }
  } catch (error: any) {
    diagnostics.supabase.error = {
      message: error.message,
      stack: error.stack,
    }
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

