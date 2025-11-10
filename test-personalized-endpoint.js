// Test script for AI Personalized endpoint
// ==========================================

import fetch from 'node-fetch';

const testPersonalizedEndpoint = async () => {
  try {
    console.log('Testing AI Personalized endpoint...');
    
    const testPayload = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      context: "Study for upcoming mathematics exam",
      preferences: {
        subjects: ["mathematics", "physics"],
        timeAvailable: 90,
        currentMood: "confident"
      },
      memoryContext: {
        query: "previous study sessions and exam preparation",
        limit: 3,
        searchType: "hybrid"
      }
    };

    console.log('Sending request with payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('http://localhost:3003/api/ai/personalized', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.text();
    console.log('Response body:', result);

    if (response.ok) {
      try {
        const data = JSON.parse(result);
        console.log('\n✅ SUCCESS: Personalized endpoint working correctly');
        console.log('Suggestions count:', data.data?.suggestions?.length || 0);
        console.log('Memories found:', data.data?.memoryContext?.memoriesFound || 0);
      } catch (parseError) {
        console.log('⚠️  Response received but JSON parsing failed');
      }
    } else {
      console.log('❌ ERROR: Request failed');
    }

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to endpoint:', error.message);
  }
};

// Run the test
testPersonalizedEndpoint();