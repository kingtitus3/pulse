import { createClient } from '@supabase/supabase-js'

// Require environment variables - fail fast if not set
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required')
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
)

// Admin client for server-side operations
export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }

  if (!process.env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL environment variable is required')
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

