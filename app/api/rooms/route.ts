import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: any = {}
    if (!includeArchived) {
      where.archived = false
    }

    const orderBy: any = {}
    if (sort === 'activity') {
      orderBy.activityScore = 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    console.log('[ROOMS API] Fetching rooms with where:', JSON.stringify(where), 'orderBy:', JSON.stringify(orderBy))
    
    let rooms
    let usedFallback = false
    
    try {
      // Try Prisma first
      rooms = await prisma.room.findMany({
        where,
        orderBy,
      })
      console.log('[ROOMS API] Prisma found', rooms.length, 'rooms')
    } catch (prismaError: any) {
      console.warn('[ROOMS API] Prisma failed, trying Supabase API fallback')
      console.warn('[ROOMS API] Prisma error:', prismaError.message)
      console.warn('[ROOMS API] Prisma error code:', prismaError.code)
      
      usedFallback = true
      
      try {
        // Fallback to Supabase API
        const supabase = getSupabaseAdmin()
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
          console.error('[ROOMS API] Supabase fallback error:', error)
          console.error('[ROOMS API] Supabase error code:', error.code)
          console.error('[ROOMS API] Supabase error message:', error.message)
          throw error
        }
        
        rooms = data || []
        console.log('[ROOMS API] ✅ Supabase fallback successful! Found', rooms.length, 'rooms')
        if (rooms.length > 0) {
          console.log('[ROOMS API] Fallback room slugs:', rooms.map((r: any) => r.slug))
        }
      } catch (supabaseError: any) {
        console.error('[ROOMS API] Both Prisma and Supabase failed!')
        console.error('[ROOMS API] Supabase error:', supabaseError.message || supabaseError)
        throw supabaseError
      }
    }
    
    // Log which method was used
    if (usedFallback) {
      console.log('[ROOMS API] ⚠️ Used Supabase fallback (Prisma connection issue)')
    } else {
      console.log('[ROOMS API] ✅ Used Prisma (normal operation)')
    }

    console.log('[ROOMS API] Found', rooms.length, 'rooms total')
    if (rooms.length > 0) {
      console.log('[ROOMS API] Room slugs:', rooms.map((r: any) => r.slug))
    } else {
      console.warn('[ROOMS API] No rooms found! This might indicate:')
      console.warn('[ROOMS API] 1. Database not seeded')
      console.warn('[ROOMS API] 2. All rooms are archived')
      console.warn('[ROOMS API] 3. Database connection issue')
    }

    return NextResponse.json(rooms)
  } catch (error: any) {
    console.error('[ROOMS API] Error:', error.message)
    console.error('[ROOMS API] Error code:', error.code)
    console.error('[ROOMS API] Error stack:', error.stack)
    logger.error('Failed to get rooms', { error: error.message, code: error.code })
    
    // Return empty array if database connection fails
    if (
      error.message?.includes('connect') ||
      error.message?.includes('P1001') ||
      error.message?.includes('Can\'t reach database server') ||
      error.code === 'P1001'
    ) {
      console.error('[ROOMS API] Database connection failed')
      return NextResponse.json([], { status: 200 })
    }
    // For other errors, still return empty array to prevent UI breakage
    console.error('[ROOMS API] Unknown error, returning empty array')
    return NextResponse.json([], { status: 200 })
  }
}

