// Run setup SQL via Supabase Management API
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()
const fs = require('fs')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSetup() {
  const sql = fs.readFileSync('scripts/complete-setup.sql', 'utf8')
  
  console.log('📝 Running setup SQL via Supabase API...')
  
  try {
    // Use RPC to execute SQL (if available) or use the REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.log('⚠️  RPC method not available, using alternative approach...')
      console.log('✅ Please run scripts/complete-setup.sql in Supabase SQL Editor')
      console.log('   URL: https://supabase.com/dashboard/project/trmaoahftumgjoufbcqk/sql/new')
      return
    }
    
    console.log('✅ Setup SQL executed successfully!')
    console.log(data)
  } catch (err) {
    console.log('⚠️  Could not execute via API')
    console.log('✅ Please run scripts/complete-setup.sql in Supabase SQL Editor')
    console.log('   URL: https://supabase.com/dashboard/project/trmaoahftumgjoufbcqk/sql/new')
  }
}

runSetup()

