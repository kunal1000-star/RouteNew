// Test the student profile API endpoint
const fetch = require('node-fetch');

async function testStudentProfileAPI() {
  console.log('🧪 Testing student profile API...');
  
  const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Example UUID
  
  try {
    const response = await fetch(`http://localhost:3000/api/student/profile?userId=${testUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📊 Response text:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Parsed data:', data);
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError);
      }
    }
    
  } catch (error) {
    console.log('❌ Fetch error:', error);
  }
}

testStudentProfileAPI();