import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .limit(10)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error,
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      rooms: data,
      message: `Found ${data?.length || 0} rooms via Supabase`,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

