#!/usr/bin/env node

/**
 * Quick test to check memory system and get detailed error messages
 */

const BASE_URL = 'http://localhost:3000';

async function testSimpleRequest() {
  console.log('🔍 Testing simple memory storage request...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/memory-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '12345678-90ab-cdef-1234-567890abcdef',
        message: 'My name is Kunal',
        response: 'Nice to meet you, Kunal!',
        conversationId: 'test-simple',
        metadata: {
          memoryType: 'learning_interaction',
          priority: 'medium',
          retention: 'long_term',
          topic: 'personal',
          tags: ['name']
        }
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testSimpleRequest();