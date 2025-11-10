#!/usr/bin/env node

/**
 * Diagnostic Test: Memory Storage Issue
 * ====================================
 */

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

async function diagnoseMemoryStorage() {
  console.log('🔍 DIAGNOSTIC: Memory Storage Issue Analysis');
  console.log('=' .repeat(50));
  
  // Test 1: Simple health check
  console.log('1. Testing memory storage health...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/ai/memory-storage?action=health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check response:', healthResponse.status);
    console.log('Health data:', JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  console.log('');
  
  // Test 2: Try memory storage with detailed error logging
  console.log('2. Testing memory storage with detailed error logging...');
  try {
    const storageResponse = await fetch(`${BASE_URL}/api/ai/memory-storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Diagnostic-Test/1.0'
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: 'My name is Kunal',
        response: 'Nice to meet you, Kunal!',
        metadata: {
          memoryType: 'learning_interaction',
          priority: 'high',
          retention: 'long_term'
        }
      })
    });

    console.log('Response status:', storageResponse.status);
    console.log('Response headers:', Object.fromEntries(storageResponse.headers.entries()));
    
    const responseText = await storageResponse.text();
    console.log('Response body:', responseText);
    
    if (storageResponse.ok) {
      const responseData = JSON.parse(responseText);
      console.log('✅ Storage successful:', responseData);
    } else {
      console.log('❌ Storage failed with status:', storageResponse.status);
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (parseError) {
        console.log('Could not parse error response as JSON');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('Error details:', error);
  }
  
  console.log('');
  
  // Test 3: Check other endpoints
  console.log('3. Testing other AI endpoints...');
  const endpoints = [
    '/api/ai/semantic-search',
    '/api/ai/personalized', 
    '/api/ai/chat'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}?action=health`);
      console.log(`${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${endpoint}: Network error - ${error.message}`);
    }
  }
}

// Run diagnostic
diagnoseMemoryStorage().catch(console.error);