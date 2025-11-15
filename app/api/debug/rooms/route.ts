import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  }

  // Test 1: Environment Variables
  results.tests.env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
  }

  // Test 2: Supabase Direct Query
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .limit(10)

    results.tests.supabase = {
      success: !error && !!data,
      error: error ? { code: error.code, message: error.message } : null,
      roomCount: data?.length || 0,
      rooms: data?.map((r: any) => ({ id: r.id, slug: r.slug, type: r.type })) || [],
    }
  } catch (error: any) {
    results.tests.supabase = {
      success: false,
      error: error.message,
      roomCount: 0,
    }
  }

  // Test 3: Prisma Query
  try {
    const prismaRooms = await prisma.room.findMany({
      where: { archived: false },
      take: 10,
    })
    results.tests.prisma = {
      success: true,
      roomCount: prismaRooms.length,
      rooms: prismaRooms.map((r) => ({ id: r.id, slug: r.slug, type: r.type })),
    }
  } catch (error: any) {
    results.tests.prisma = {
      success: false,
      error: error.message,
      code: error.code,
      roomCount: 0,
    }
  }

  // Test 4: Main API Route (simulate)
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .order('activityScore', { ascending: false })

    results.tests.mainAPI = {
      success: !error && !!data,
      error: error ? { code: error.code, message: error.message } : null,
      roomCount: data?.length || 0,
      method: 'supabase',
    }
  } catch (error: any) {
    results.tests.mainAPI = {
      success: false,
      error: error.message,
      roomCount: 0,
    }
  }

  // Overall status
  results.status = 
    results.tests.supabase?.success || results.tests.prisma?.success
      ? 'healthy'
      : 'unhealthy'

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

