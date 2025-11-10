#!/usr/bin/env node

/**
 * Test Study Buddy Memory Fix
 * ============================
 * 
 * This test verifies that the Study Buddy memory integration is working properly
 * by testing the conversation flow:
 * 1. User says "My name is Kunal"
 * 2. User asks "Do you know my name?"
 * 3. AI should respond with personalized memory-based response
 */

const { createClient } = require('@supabase/supabase-js');

// Environment setup
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStudyBuddyMemory() {
  console.log('🧪 Testing Study Buddy Memory Integration...\n');

  try {
    // 1. Sign in test user (create anonymous session for testing)
    console.log('1. Setting up test session...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.log('⚠️  Anonymous sign-in not available, trying to use existing session...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user available for testing');
      }
      console.log(`✅ Using existing session for user: ${user.id}`);
    } else {
      console.log(`✅ Created test session for user: ${authData.user.id}`);
    }

    // 2. Test Study Buddy API with memory scenario
    const testUserId = authData?.user?.id || (await supabase.auth.getUser()).data.user.id;
    const conversationId = 'test-conversation-' + Date.now();

    console.log('\n2. Testing memory integration...');
    
    // Test 1: Store name information
    console.log('📝 Test 1: Storing user name in memory...');
    const nameResponse = await fetch(`${supabaseUrl}/functions/v1/chat/study-assistant/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        conversationId: conversationId,
        message: 'My name is Kunal and I am studying for JEE 2025',
        chatType: 'study_assistant',
        isPersonalQuery: true
      }),
    });

    if (!nameResponse.ok) {
      throw new Error(`API call failed: ${nameResponse.status} ${nameResponse.statusText}`);
    }

    const nameData = await nameResponse.json();
    console.log('📊 Name storage response:', {
      success: nameData.success,
      memoryContext: nameData.data?.memoryContext,
      responseLength: nameData.data?.response?.content?.length
    });

    // Small delay to ensure memory is stored
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Retrieve memory with personal question
    console.log('\n🔍 Test 2: Testing memory retrieval...');
    const memoryResponse = await fetch(`${supabaseUrl}/functions/v1/chat/study-assistant/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        conversationId: conversationId,
        message: 'Do you know my name?',
        chatType: 'study_assistant',
        isPersonalQuery: true
      }),
    });

    if (!memoryResponse.ok) {
      throw new Error(`API call failed: ${memoryResponse.status} ${memoryResponse.statusText}`);
    }

    const memoryData = await memoryResponse.json();
    console.log('📊 Memory retrieval response:', {
      success: memoryData.success,
      memoryContext: memoryData.data?.memoryContext,
      response: memoryData.data?.response?.content?.substring(0, 200) + '...'
    });

    // 3. Analyze results
    console.log('\n3. Analysis:');
    
    // Check if memory was found
    const memoryFound = memoryData.data?.memoryContext?.memoriesFound > 0;
    console.log(`   Memory found: ${memoryFound ? '✅' : '❌'}`);
    
    // Check if response is personalized
    const response = memoryData.data?.response?.content || '';
    const isPersonalized = response.toLowerCase().includes('kunal') || 
                          response.toLowerCase().includes('your name') ||
                          response.toLowerCase().includes('i remember');
    console.log(`   Response personalized: ${isPersonalized ? '✅' : '❌'}`);
    
    // Check if response is not generic
    const isNotGeneric = !response.toLowerCase().includes('i don\'t have access to previous conversations') &&
                        !response.toLowerCase().includes('i don\'t have memory') &&
                        !response.toLowerCase().includes('i don\'t have past');
    console.log(`   Response not generic: ${isNotGeneric ? '✅' : '❌'}`);

    // 4. Final assessment
    console.log('\n4. Test Results:');
    const allTestsPassed = memoryFound && isPersonalized && isNotGeneric;
    
    if (allTestsPassed) {
      console.log('✅ Study Buddy Memory Integration: WORKING');
      console.log('   - Memory is being stored and retrieved correctly');
      console.log('   - Personalized responses are being generated');
      console.log('   - Generic fallback responses are NOT being used');
    } else {
      console.log('❌ Study Buddy Memory Integration: ISSUES DETECTED');
      if (!memoryFound) console.log('   - Memory not being found in database');
      if (!isPersonalized) console.log('   - Responses are not personalized');
      if (!isNotGeneric) console.log('   - Generic responses are still being used');
    }

    console.log('\n5. Sample Response:');
    console.log('   "' + response + '"');

    return allTestsPassed;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testStudyBuddyMemory()
    .then(success => {
      console.log(`\n🏁 Test completed: ${success ? 'PASS' : 'FAIL'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testStudyBuddyMemory };