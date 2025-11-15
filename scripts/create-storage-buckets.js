// Script to create Supabase Storage buckets
// Run with: node scripts/create-storage-buckets.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBuckets() {
  const buckets = [
    { name: 'images', public: true },
    { name: 'stickers', public: true },
    { name: 'avatars', public: true },
  ]

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.name === 'images' ? 5242880 : 2097152, // 5MB for images, 2MB for others
        allowedMimeTypes: ['image/*'],
      })

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket '${bucket.name}' already exists`)
        } else {
          console.error(`❌ Error creating bucket '${bucket.name}':`, error.message)
        }
      } else {
        console.log(`✅ Created bucket '${bucket.name}'`)
      }
    } catch (err) {
      console.error(`❌ Error creating bucket '${bucket.name}':`, err.message)
    }
  }
}

createBuckets()
  .then(() => {
    console.log('\n✅ Storage buckets setup complete!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })

