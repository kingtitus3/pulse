// Seed database via Supabase API
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('🌱 Seeding database via Supabase API...\n')

  try {
    // 1. Create System User
    console.log('1. Creating System user...')
    const { data: systemUser, error: userError } = await supabase
      .from('User')
      .upsert({
        id: 'system',
        displayName: 'System',
        avatar: 'system',
        isAnonymous: false,
        role: 'admin',
        createdAt: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (userError) {
      console.error('   ❌ Error:', userError.message)
    } else {
      console.log('   ✅ System user created')
    }

    // 2. Seed Core Rooms
    console.log('\n2. Seeding core rooms...')
    const rooms = [
      {
        id: 'room-markets',
        slug: 'markets',
        type: 'core',
        shortName: 'Markets',
        title: 'Markets',
        category: 'trading',
        description: 'Charts, trading, and market discussion',
        tags: ['trading', 'charts', 'markets'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-memes',
        slug: 'memes',
        type: 'core',
        shortName: 'Memes',
        title: 'Memes',
        category: 'entertainment',
        description: 'Memes and screenshots',
        tags: ['memes', 'funny'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 90,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-builders',
        slug: 'builders',
        type: 'core',
        shortName: 'Builders',
        title: 'Builders',
        category: 'development',
        description: 'Development and building',
        tags: ['dev', 'building'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 80,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-help',
        slug: 'help',
        type: 'core',
        shortName: 'Help',
        title: 'Help',
        category: 'support',
        description: 'Support and questions',
        tags: ['help', 'support'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 70,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-irl',
        slug: 'irl',
        type: 'core',
        shortName: 'IRL',
        title: 'IRL',
        category: 'lifestyle',
        description: 'Life outside crypto',
        tags: ['life', 'irl'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 60,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-general',
        slug: 'general',
        type: 'core',
        shortName: 'General',
        title: 'General',
        category: 'general',
        description: 'Main lobby',
        tags: ['general'],
        nsfw: false,
        slowModeSeconds: 0,
        isFeatured: true,
        archived: false,
        activityScore: 50,
        createdAt: new Date().toISOString(),
      },
    ]

    for (const room of rooms) {
      const { error } = await supabase
        .from('Room')
        .upsert(room, { onConflict: 'id' })

      if (error) {
        console.error(`   ❌ Error creating ${room.slug}:`, error.message)
      } else {
        console.log(`   ✅ Created room: ${room.shortName}`)
      }
    }

    console.log('\n✅ Database seeding complete!')
    console.log('\n📋 Next: Enable Realtime in Supabase Dashboard')
    console.log('   Run this SQL: ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

seedDatabase()

