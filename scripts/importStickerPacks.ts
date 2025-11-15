import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const STOPWORDS = new Set([
  'pack',
  'base',
  'official',
  'the',
  'and',
  'of',
  'for',
  'v1',
  'v2',
  'v3',
])

function inferKindFromName(name: string): string {
  const lower = name.toLowerCase()
  if (/(reaction|react|emote|emoji|face|expression)/.test(lower)) return 'reaction'
  if (/(meme|shitpost|funny|lol|haha|giggle|lmao)/.test(lower)) return 'meme'
  if (/(bork|bear|bonk|pepe|wojak|chef|fox|dog|cat|frog|skeleton|skelly)/.test(
    lower
  ))
    return 'character'
  if (
    /(solana|sol|eth|ethereum|btc|bitcoin|tron|bnb|avax|base|polygon|matic|arbitrum)/.test(
      lower
    )
  )
    return 'chain'
  if (/(brand|logo|official|merch|promo)/.test(lower)) return 'brand'
  return 'other'
}

function inferTagsFromName(name: string): string[] {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w))
  return Array.from(new Set(cleaned))
}

// TODO: Fill with real sticker pack data
const RAW_PACKS: {
  slug: string
  name: string
  basePath: string
  description?: string
  author?: string
  isNsfw?: boolean
}[] = [
  // Example placeholder - replace with actual packs
  {
    slug: 'bork-base',
    name: 'Bork – Base Pack',
    basePath: 'packs/bork-base',
    description: 'Classic Bork reactions',
    author: 'Community',
    isNsfw: false,
  },
]

async function main() {
  console.log('Importing sticker packs...')

  for (const packData of RAW_PACKS) {
    const kind = inferKindFromName(packData.name)
    const tags = inferTagsFromName(packData.name)

    const pack = await prisma.stickerPack.upsert({
      where: { slug: packData.slug },
      update: {
        name: packData.name,
        description: packData.description || null,
        author: packData.author || null,
        basePath: packData.basePath,
        kind,
        tags,
        isNsfw: packData.isNsfw || false,
      },
      create: {
        slug: packData.slug,
        name: packData.name,
        description: packData.description || null,
        author: packData.author || null,
        basePath: packData.basePath,
        kind,
        tags,
        isNsfw: packData.isNsfw || false,
      },
    })

    console.log(`✓ Imported pack: ${pack.name} (${kind})`)

    // TODO: Scan storage directory and create Sticker records
    // For now, stickers will be created on-demand or via separate script
  }

  console.log('Import complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

