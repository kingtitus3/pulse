/**
 * Build sticker URL from pack base path and filename
 */
export function buildStickerUrl(basePath: string, filename: string): string {
  // Assuming stickers are stored in Supabase Storage
  // Format: /storage/v1/object/public/stickers/{basePath}/{filename}
  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is required')
  }
  const baseUrl = process.env.SUPABASE_URL
  const storagePath = `${baseUrl}/storage/v1/object/public/stickers/${basePath}/${filename}`
  return storagePath
}

/**
 * Get sticker pack thumbnail URL (first sticker in pack)
 */
export function getPackThumbnailUrl(
  basePath: string,
  firstStickerFilename: string
): string {
  return buildStickerUrl(basePath, firstStickerFilename)
}

