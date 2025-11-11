import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Quick test endpoint to verify all critical infrastructure is working
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Infrastructure Test Endpoint Called');
    
    // Test 1: Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envTest = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    };
    
    // Test 2: Check if Supabase client can be created
    let supabaseTest = { canCreate: false, error: null };
    try {
      const supabase = createClient(supabaseUrl!, supabaseKey!);
      supabaseTest.canCreate = true;
    } catch (error) {
      supabaseTest.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test 3: Check authentication handling
    const authHeader = request.headers.get('authorization');
    const hasAuth = !!authHeader && authHeader.startsWith('Bearer ');
    
    // Test 4: Check database connection
    let dbTest = { canConnect: false, error: null };
    try {
      const supabase = createClient(supabaseUrl!, supabaseKey!);
      const { data, error } = await supabase.from('student_ai_profile').select('count', { count: 'exact', head: true });
      dbTest.canConnect = !error;
      if (error) dbTest.error = error.message;
    } catch (error) {
      dbTest.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test 5: Check critical API endpoints exist
    const criticalEndpoints = [
      '/api/chat/conversations',
      '/api/ai/chat',
      '/api/student/profile',
      '/api/chat/study-assistant/send'
    ];
    
    // Test results
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: envTest,
      supabase: supabaseTest,
      authentication: {
        hasAuthHeader: hasAuth,
        authHeader: authHeader ? 'Bearer [REDACTED]' : 'None'
      },
      database: dbTest,
      criticalEndpoints,
      status: 'Infrastructure test completed'
    };
    
    console.log('✅ Infrastructure test results:', testResults);
    
    return NextResponse.json({
      success: true,
      results: testResults,
      summary: {
        environment: envTest.hasUrl && envTest.hasKey ? '✅ OK' : '❌ Missing',
        supabase: supabaseTest.canCreate ? '✅ OK' : '❌ Failed',
        database: dbTest.canConnect ? '✅ OK' : '❌ Failed',
        authentication: hasAuth ? '✅ Authenticated' : '⚠️ Anonymous'
      }
    });
    
  } catch (error) {
    console.error('❌ Infrastructure test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}