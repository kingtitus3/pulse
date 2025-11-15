import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    console.log('[ROOMS TEST] Starting room fetch...')
    
    // Check environment variables
    if (!process.env.SUPABASE_URL) {
      console.error('[ROOMS TEST] SUPABASE_URL not set')
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_URL environment variable not set',
      }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[ROOMS TEST] SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY environment variable not set',
      }, { status: 500 })
    }

    console.log('[ROOMS TEST] Environment variables OK, creating Supabase client...')
    const supabase = getSupabaseAdmin()
    console.log('[ROOMS TEST] Supabase client created')
    
    console.log('[ROOMS TEST] Querying Room table...')
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .limit(100) // Increased limit
    
    if (error) {
      console.error('[ROOMS TEST] Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error,
      })
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error,
      }, { status: 500 })
    }
    
    console.log('[ROOMS TEST] Query successful, found', data?.length || 0, 'rooms')
    console.log('[ROOMS TEST] Room slugs:', data?.map((r: any) => r.slug) || [])
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      rooms: data || [],
      message: `Found ${data?.length || 0} rooms via Supabase`,
    })
  } catch (error: any) {
    console.error('[ROOMS TEST] Unexpected error:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

