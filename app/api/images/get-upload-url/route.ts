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

    // Rate limiting: 3 images per 10 minutes
    const rateLimitResult = await checkRateLimit(
      `image:${sessionData.session.id}`,
      {
        limit: 3,
        windowSeconds: 600,
      }
    )

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { contentType } = body

    // Validate content type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!contentType || !allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Allowed: png, jpeg, webp' },
        { status: 400 }
      )
    }

    // Generate file path
    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
    const filename = `${createId()}.${extension}`
    const filePath = `uploads/${sessionData.user.id}/${filename}`

    // Get Supabase admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Generate signed upload URL
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .createSignedUploadUrl(filePath, {
        upsert: false,
      })

    if (error) {
      logger.error('Failed to create upload URL', { error })
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
    logger.error('Failed to get upload URL', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

