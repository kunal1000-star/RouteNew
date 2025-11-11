/**
 * Test Study Buddy API to identify exact error
 */

const baseUrl = 'http://localhost:3000';
const testUserId = 'test-user-123';

async function testStudyBuddy() {
    console.log('🔍 Testing Study Buddy API for exact error...');
    
    const testMessage = {
        message: 'Hello, can you help me with thermodynamics?',
        userId: testUserId,
        conversationId: 'test-conversation-123',
        context: {
            type: 'study',
            subject: 'physics'
        }
    };
    
    try {
        console.log('📤 Sending test request to study-buddy endpoint...');
        console.log('Request body:', JSON.stringify(testMessage, null, 2));
        
        const response = await fetch(`${baseUrl}/api/study-buddy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(testMessage)
        });
        
        console.log('📥 Response received:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (responseText) {
            try {
                const responseJson = JSON.parse(responseText);
                console.log('Parsed response:', JSON.stringify(responseJson, null, 2));
            } catch (parseError) {
                console.log('Failed to parse response as JSON');
            }
        }
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            response: responseText
        };
        
    } catch (error) {
        console.error('❌ Request failed with error:', error);
        return {
            success: false,
            error: error.message,
            errorType: error.constructor.name
        };
    }
}

async function testAiChatDirectly() {
    console.log('\n🔍 Testing AI Chat endpoint directly...');
    
    const testMessage = {
        userId: testUserId,
        message: 'Hello, can you help me with thermodynamics?',
        conversationId: 'test-conversation-123',
        provider: 'groq',
        model: 'llama-3.1-8b-instant'
    };
    
    try {
        console.log('📤 Sending test request to AI chat endpoint...');
        console.log('Request body:', JSON.stringify(testMessage, null, 2));
        
        const response = await fetch(`${baseUrl}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(testMessage)
        });
        
        console.log('📥 Response received:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        if (responseText) {
            try {
                const responseJson = JSON.parse(responseText);
                console.log('Parsed response keys:', Object.keys(responseJson));
            } catch (parseError) {
                console.log('Failed to parse response as JSON');
            }
        }
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            response: responseText
        };
        
    } catch (error) {
        console.error('❌ AI Chat request failed with error:', error);
        return {
            success: false,
            error: error.message,
            errorType: error.constructor.name
        };
    }
}

async function main() {
    console.log('=== STUDY BUDDY ERROR DEBUG ===\n');
    
    // Test AI chat directly first
    const aiResult = await testAiChatDirectly();
    
    // Test study buddy
    const studyBuddyResult = await testStudyBuddy();
    
    console.log('\n=== SUMMARY ===');
    console.log('AI Chat Result:', aiResult);
    console.log('Study Buddy Result:', studyBuddyResult);
    
    if (!aiResult.success) {
        console.log('\n🚨 AI CHAT IS FAILING - This is the root cause');
    } else if (!studyBuddyResult.success) {
        console.log('\n🚨 STUDY BUDDY IS FAILING - But AI Chat works');
    } else {
        console.log('\n✅ Both endpoints appear to be working');
    }
}

// Run the test
main().catch(console.error);