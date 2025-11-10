#!/usr/bin/env node

// Web Search Endpoint Test
// =========================

async function testWebSearchEndpoint() {
  try {
    console.log('🧪 Testing AI Web Search Endpoint...');
    
    // Test using curl command instead
    const { exec } = require('child_process');
    
    // Test the health check first
    console.log('\n🏥 Testing health check...');
    
    exec('curl -s "http://localhost:3000/api/ai/web-search?action=health"', (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.log(`⚠️ Health check stderr: ${stderr}`);
      }
      
      try {
        const healthData = JSON.parse(stdout);
        console.log('✅ Health check successful!');
        console.log('📊 Health data:');
        console.log(JSON.stringify(healthData, null, 2));
      } catch (parseError) {
        console.log('❌ Failed to parse health check response:');
        console.log('Raw response:', stdout);
      }
    });
    
    // Test the main search endpoint
    setTimeout(() => {
      console.log('\n🔍 Testing main search endpoint...');
      
      const testPayload = {
        query: 'artificial intelligence',
        searchType: 'general',
        limit: 3
      };
      
      const payloadString = JSON.stringify(testPayload).replace(/"/g, '\\"');
      
      exec(`curl -s -X POST "http://localhost:3000/api/ai/web-search" \\
        -H "Content-Type: application/json" \\
        -d "${payloadString}"`, (error, stdout, stderr) => {
        
        if (error) {
          console.log(`❌ Search test failed: ${error.message}`);
          return;
        }
        
        if (stderr) {
          console.log(`⚠️ Search test stderr: ${stderr}`);
        }
        
        try {
          const searchData = JSON.parse(stdout);
          console.log('✅ Search test successful!');
          console.log('📊 Search response:');
          console.log(JSON.stringify(searchData, null, 2));
        } catch (parseError) {
          console.log('❌ Failed to parse search response:');
          console.log('Raw response:', stdout);
        }
      });
    }, 2000); // Wait 2 seconds for health check to complete
    
  } catch (error) {
    console.log('❌ Test script failed with error:');
    console.log('Error:', error.message);
  }
}

testWebSearchEndpoint();