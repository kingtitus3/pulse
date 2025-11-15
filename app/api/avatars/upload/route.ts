import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimit'
import { getSupabaseAdmin } from '@/lib/supabaseClient'
import { logger } from '@/lib/logger'
import { createId } from '@paralleldrive/cuid2'

export async function POST(req: NextRequest) {
  try {
    const sessionData = await getSessionFromRequest(req)

    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 5 avatar uploads per hour
    const rateLimitResult = await checkRateLimit(
      `avatar:${sessionData.session.id}`,
      {
        limit: 5,
        windowSeconds: 3600,
      }
    )

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 avatar uploads per hour.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { contentType } = body

    // Validate content type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!contentType || !allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Allowed: png, jpeg, webp, gif' },
        { status: 400 }
      )
    }

    // Generate file path for avatar
    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
    const filename = `${createId()}.${extension}`
    const filePath = `avatars/${sessionData.user.id}/${filename}`

    // Get Supabase admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Generate signed upload URL
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .createSignedUploadUrl(filePath, {
        upsert: true, // Allow overwriting existing avatars
      })

    if (error) {
      logger.error('Failed to create avatar upload URL', { error })
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    // Construct public URL
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/images/${filePath}`

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      publicUrl,
      filePath,
    })
  } catch (error) {
    logger.error('Failed to get avatar upload URL', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

