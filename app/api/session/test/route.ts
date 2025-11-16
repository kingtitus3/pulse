import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Test 1: Check if Supabase client is available
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase admin client not available',
        test: 'client_check',
        passed: false
      }, { status: 500 })
    }

    // Test 2: Try to query User table structure
    const { data: userTest, error: userError } = await supabase
      .from('User')
      .select('id')
      .limit(1)

    if (userError) {
      return NextResponse.json({
        error: 'User table query failed',
        test: 'user_table',
        passed: false,
        details: {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint,
        }
      }, { status: 500 })
    }

    // Test 3: Try to query Session table structure
    const { data: sessionTest, error: sessionError } = await supabase
      .from('Session')
      .select('id')
      .limit(1)

    if (sessionError) {
      return NextResponse.json({
        error: 'Session table query failed',
        test: 'session_table',
        passed: false,
        details: {
          message: sessionError.message,
          code: sessionError.code,
          details: sessionError.details,
          hint: sessionError.hint,
        }
      }, { status: 500 })
    }

    // Test 4: Try to create a test user
    const testDisplayName = `TestUser_${Date.now()}`
    const { data: testUser, error: createUserError } = await supabase
      .from('User')
      .insert({
        displayName: testDisplayName,
        avatar: 'avatar-1',
        isAnonymous: true,
        role: 'user',
        tags: [],
        showWallets: false,
      })
      .select()
      .single()

    if (createUserError) {
      return NextResponse.json({
        error: 'User creation failed',
        test: 'create_user',
        passed: false,
        details: {
          message: createUserError.message,
          code: createUserError.code,
          details: createUserError.details,
          hint: createUserError.hint,
        }
      }, { status: 500 })
    }

    // Test 5: Try to create a test session
    const { data: testSession, error: createSessionError } = await supabase
      .from('Session')
      .insert({
        userId: testUser.id,
        ipHash: null,
      })
      .select()
      .single()

    if (createSessionError) {
      // Clean up test user
      await supabase.from('User').delete().eq('id', testUser.id)
      
      return NextResponse.json({
        error: 'Session creation failed',
        test: 'create_session',
        passed: false,
        details: {
          message: createSessionError.message,
          code: createSessionError.code,
          details: createSessionError.details,
          hint: createSessionError.hint,
        }
      }, { status: 500 })
    }

    // Clean up test data
    await supabase.from('Session').delete().eq('id', testSession.id)
    await supabase.from('User').delete().eq('id', testUser.id)

    return NextResponse.json({
      success: true,
      message: 'All tests passed! Session creation should work.',
      tests: {
        client_check: true,
        user_table: true,
        session_table: true,
        create_user: true,
        create_session: true,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

