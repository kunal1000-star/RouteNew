/**
 * Debug Test - Shows full response structure
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/ai/chat';

async function debugResponse(testName, payload) {
  console.log(`\n🔍 DEBUGGING: ${testName}`);
  console.log(`Sending payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log(`Raw response: ${text}`);
    
    let parsed;
    try {
      parsed = JSON.parse(text);
      console.log(`Parsed successfully`);
      console.log(`Response structure:`, JSON.stringify(parsed, null, 2));
      
      // Try to access different possible paths
      if (parsed.data?.aiResponse?.content) {
        console.log(`✅ AI Response: ${parsed.data.aiResponse.content.substring(0, 300)}...`);
      } else if (parsed.aiResponse?.content) {
        console.log(`✅ AI Response (alt path): ${parsed.aiResponse.content.substring(0, 300)}...`);
      } else {
        console.log(`⚠️ No AI response content found`);
      }
      
      if (parsed.data?.integrationStatus) {
        console.log(`✅ Integration Status:`, parsed.data.integrationStatus);
      } else if (parsed.integrationStatus) {
        console.log(`✅ Integration Status (alt path):`, parsed.integrationStatus);
      } else {
        console.log(`⚠️ No integration status found`);
      }
      
    } catch (parseError) {
      console.log(`❌ JSON parse error:`, parseError.message);
    }
    
  } catch (error) {
    console.log(`❌ Network error:`, error.message);
  }
  
  console.log('='.repeat(60));
}

// Run key debug tests
async function runDebugTests() {
  console.log('🔬 STUDY BUDDY SYSTEM DEBUGGING');
  
  // Test 1: Critical Thermodynamics Test
  await debugResponse('Critical Thermodynamics Test', {
    message: 'thermodynamics sajha do',
    userId: 'test-user-12345',
    conversationHistory: []
  });
  
  // Test 2: Simple Basic Test
  await debugResponse('Basic Functionality Test', {
    message: 'hello',
    userId: 'test-user-12345'
  });
  
  // Test 3: Test the exact same format that worked before
  await debugResponse('Same Format as Working Test', {
    test: 'ping'
  });
}

runDebugTests().catch(console.error);