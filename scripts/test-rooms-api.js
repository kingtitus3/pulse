#!/usr/bin/env node

/**
 * Diagnostic script to test rooms API at each layer
 * Usage: node scripts/test-rooms-api.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

async function testSupabaseDirect() {
  log('\n🔍 TEST 1: Direct Supabase Connection', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ Missing Supabase credentials', 'red')
    log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing', 'yellow')
    log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing', 'yellow')
    return false
  }
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    log('✅ Supabase client created', 'green')
    log(`   URL: ${process.env.SUPABASE_URL.substring(0, 40)}...`, 'blue')
    
    const { data, error } = await supabase
      .from('Room')
      .select('*')
      .eq('archived', false)
      .order('activityScore', { ascending: false })
    
    if (error) {
      log('❌ Supabase query error:', 'red')
      log(`   Code: ${error.code}`, 'red')
      log(`   Message: ${error.message}`, 'red')
      log(`   Details: ${JSON.stringify(error, null, 2)}`, 'red')
      return false
    }
    
    if (!data || data.length === 0) {
      log('⚠️  No rooms found in database', 'yellow')
      log('   This means the database needs to be seeded', 'yellow')
      return false
    }
    
    log(`✅ Found ${data.length} rooms:`, 'green')
    data.forEach((room, i) => {
      log(`   ${i + 1}. ${room.slug} (${room.type}) - ${room.shortName}`, 'blue')
    })
    
    return true
  } catch (error) {
    log('❌ Supabase connection failed:', 'red')
    log(`   ${error.message}`, 'red')
    return false
  }
}

async function testLocalAPI() {
  log('\n🔍 TEST 2: Local API Endpoint', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    const response = await fetch('http://localhost:3000/api/rooms?sort=activity', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    log(`   Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red')
    
    if (!response.ok) {
      const text = await response.text()
      log(`   Error: ${text}`, 'red')
      return false
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      log('❌ API returned non-array:', 'red')
      log(`   Type: ${typeof data}`, 'red')
      log(`   Value: ${JSON.stringify(data, null, 2)}`, 'red')
      return false
    }
    
    if (data.length === 0) {
      log('⚠️  API returned empty array', 'yellow')
      log('   Check server logs for errors', 'yellow')
      return false
    }
    
    log(`✅ API returned ${data.length} rooms:`, 'green')
    data.slice(0, 3).forEach((room, i) => {
      log(`   ${i + 1}. ${room.slug} (${room.type})`, 'blue')
    })
    if (data.length > 3) {
      log(`   ... and ${data.length - 3} more`, 'blue')
    }
    
    return true
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('⚠️  Local server not running', 'yellow')
      log('   Start with: npm run dev', 'yellow')
    } else {
      log('❌ API request failed:', 'red')
      log(`   ${error.message}`, 'red')
    }
    return false
  }
}

async function testProductionAPI() {
  log('\n🔍 TEST 3: Production API Endpoint', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  const productionUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/rooms?sort=activity`
    : 'https://pulsechat.space/api/rooms?sort=activity'
  
  log(`   Testing: ${productionUrl}`, 'blue')
  
  try {
    const response = await fetch(productionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    log(`   Status: ${response.status} ${response.statusText}`, response.ok ? 'green' : 'red')
    
    if (!response.ok) {
      const text = await response.text()
      log(`   Error: ${text.substring(0, 200)}`, 'red')
      return false
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data)) {
      log('❌ API returned non-array:', 'red')
      log(`   Type: ${typeof data}`, 'red')
      log(`   Value: ${JSON.stringify(data, null, 2).substring(0, 200)}`, 'red')
      return false
    }
    
    if (data.length === 0) {
      log('⚠️  API returned empty array', 'yellow')
      log('   Check Vercel logs: vercel logs', 'yellow')
      return false
    }
    
    log(`✅ API returned ${data.length} rooms:`, 'green')
    data.slice(0, 3).forEach((room, i) => {
      log(`   ${i + 1}. ${room.slug} (${room.type})`, 'blue')
    })
    if (data.length > 3) {
      log(`   ... and ${data.length - 3} more`, 'blue')
    }
    
    return true
  } catch (error) {
    log('❌ Production API request failed:', 'red')
    log(`   ${error.message}`, 'red')
    return false
  }
}

async function testTestEndpoint() {
  log('\n🔍 TEST 4: Test Endpoint', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  const testUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/rooms/test`
    : 'https://pulsechat.space/api/rooms/test'
  
  log(`   Testing: ${testUrl}`, 'blue')
  
  try {
    const response = await fetch(testUrl)
    const data = await response.json()
    
    if (data.success) {
      log(`✅ Test endpoint successful:`, 'green')
      log(`   Found ${data.count} rooms`, 'blue')
      if (data.rooms && data.rooms.length > 0) {
        log(`   First room: ${data.rooms[0].slug}`, 'blue')
      }
      return true
    } else {
      log('❌ Test endpoint failed:', 'red')
      log(`   Error: ${data.error}`, 'red')
      return false
    }
  } catch (error) {
    log('❌ Test endpoint request failed:', 'red')
    log(`   ${error.message}`, 'red')
    return false
  }
}

async function checkEnvironmentVariables() {
  log('\n🔍 TEST 0: Environment Variables', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const optional = [
    'DATABASE_URL',
    'VERCEL_URL',
  ]
  
  let allPresent = true
  
  required.forEach(key => {
    const value = process.env[key]
    if (value) {
      log(`✅ ${key}: Set (${value.substring(0, 20)}...)`, 'green')
    } else {
      log(`❌ ${key}: Missing`, 'red')
      allPresent = false
    }
  })
  
  optional.forEach(key => {
    const value = process.env[key]
    if (value) {
      log(`ℹ️  ${key}: Set`, 'blue')
    } else {
      log(`⚠️  ${key}: Not set (optional)`, 'yellow')
    }
  })
  
  return allPresent
}

async function main() {
  log('\n🚀 ROOMS API DIAGNOSTIC TEST', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  const results = {
    env: await checkEnvironmentVariables(),
    supabase: await testSupabaseDirect(),
    localAPI: await testLocalAPI(),
    productionAPI: await testProductionAPI(),
    testEndpoint: await testTestEndpoint(),
  }
  
  log('\n📊 SUMMARY', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌'
    const color = passed ? 'green' : 'red'
    log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`, color)
  })
  
  log('\n💡 NEXT STEPS:', 'cyan')
  
  if (!results.env) {
    log('   1. Set missing environment variables in .env', 'yellow')
    log('   2. For Vercel: vercel env pull', 'yellow')
  }
  
  if (!results.supabase) {
    log('   1. Check Supabase credentials', 'yellow')
    log('   2. Verify database is seeded: node scripts/seed-via-api.js', 'yellow')
  }
  
  if (!results.productionAPI && results.supabase) {
    log('   1. Check Vercel environment variables', 'yellow')
    log('   2. Check Vercel logs: vercel logs', 'yellow')
    log('   3. Verify API route is deployed correctly', 'yellow')
  }
  
  if (results.productionAPI && results.supabase) {
    log('   ✅ API is working! Check frontend code and browser console', 'green')
  }
  
  log('\n', 'reset')
}

main().catch(console.error)

