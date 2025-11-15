import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORE_ROOMS = [
  {
    slug: 'markets',
    type: 'core',
    shortName: 'Markets',
    title: '📉 Markets – Charts & Plays',
    category: 'markets',
    description:
      'Live price talk, entries, exits, and on-chain moves. Share charts, thesis, wins and brutal Ls.',
    tags: ['charts', 'trading', 'alpha', 'memecoins'],
    nsfw: false,
    slowModeSeconds: 3,
    isFeatured: true,
  },
  {
    slug: 'memes',
    type: 'core',
    shortName: 'Memes',
    title: '😂 Memes – Post & Roast',
    category: 'memes',
    description:
      'Pure brain rot. Memes, screenshots, tweets, zero alpha. Keep it fun, do not get personal.',
    tags: ['memes', 'screenshots', 'shitposts'],
    nsfw: false,
    slowModeSeconds: 2,
    isFeatured: true,
  },
  {
    slug: 'builders',
    type: 'core',
    shortName: 'Builders',
    title: '👨‍💻 Builders – Trench Chat',
    category: 'builders',
    description:
      'Dev, design, bots, launch mechanics. Show what you are building, ask questions, share code.',
    tags: ['dev', 'bots', 'nfts', 'product'],
    nsfw: false,
    slowModeSeconds: 3,
    isFeatured: true,
  },
  {
    slug: 'help',
    type: 'core',
    shortName: 'Help',
    title: '🆘 Help – No Dumb Questions',
    category: 'help',
    description:
      'New to crypto or just confused? Ask anything. Wallets, swaps, rugs, security, basics.',
    tags: ['support', 'newbie', 'faq', 'security'],
    nsfw: false,
    slowModeSeconds: 5,
    isFeatured: true,
  },
  {
    slug: 'irl',
    type: 'core',
    shortName: 'IRL',
    title: '🏋️ IRL – Gym, Life, Everything Else',
    category: 'irl',
    description:
      'Touch grass, lift weights, talk work, relationships, and life outside the chart.',
    tags: ['fitness', 'life', 'work', 'health'],
    nsfw: false,
    slowModeSeconds: 5,
    isFeatured: true,
  },
  {
    slug: 'general',
    type: 'core',
    shortName: 'General',
    title: '💬 General – Lobby Chat',
    category: 'general',
    description:
      'Main hallway of Pulse.exe. Say hi, ask what is moving, find the right room.',
    tags: ['lobby', 'random', 'social'],
    nsfw: false,
    slowModeSeconds: 3,
    isFeatured: true,
  },
]

async function main() {
  console.log('Seeding database...')

  // Seed core rooms
  for (const roomData of CORE_ROOMS) {
    await prisma.room.upsert({
      where: { slug: roomData.slug },
      update: roomData,
      create: roomData,
    })
    console.log(`✓ Seeded room: ${roomData.slug}`)
  }

  // Create system user if it doesn't exist
  // Note: Prisma doesn't support upsert by non-unique field, so we check first
  let systemUser = await prisma.user.findFirst({
    where: { displayName: 'System', role: 'admin' },
  })

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        displayName: 'System',
        avatar: 'system',
        isAnonymous: false,
        role: 'admin',
      },
    })
  }
  console.log(`✓ System user: ${systemUser.id}`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
