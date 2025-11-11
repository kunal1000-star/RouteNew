/**
 * Test Web Search functionality specifically
 */

const baseUrl = 'http://localhost:3000';
const testUserId = 'test-user-123';

async function testWebSearchFunctionality() {
    console.log('🔍 Testing Web Search functionality...');
    
    // Test cases that SHOULD trigger web search
    const webSearchTestCases = [
        {
            name: "Current Date Query",
            message: "what is today's date?",
            expected: "Should trigger web search"
        },
        {
            name: "Current Time Query", 
            message: "what is the current time?",
            expected: "Should trigger web search"
        },
        {
            name: "Latest News Query",
            message: "what are the latest news about AI?",
            expected: "Should trigger web search"
        },
        {
            name: "Recent Events Query",
            message: "what recent events happened today?",
            expected: "Should trigger web search"
        }
    ];
    
    for (const testCase of webSearchTestCases) {
        console.log(`\n📤 Testing: ${testCase.name}`);
        console.log(`Message: "${testCase.message}"`);
        console.log(`Expected: ${testCase.expected}`);
        
        const testMessage = {
            userId: testUserId,
            message: testCase.message,
            conversationId: 'web-search-test-' + Date.now(),
            provider: 'groq',
            model: 'llama-3.1-8b-instant'
        };
        
        try {
            const response = await fetch(`${baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                body: JSON.stringify(testMessage)
            });
            
            const responseJson = await response.json();
            
            if (responseJson.success && responseJson.data) {
                const aiResponse = responseJson.data.aiResponse;
                console.log(`✅ Status: ${response.status}`);
                console.log(`🔍 Web Search Enabled: ${aiResponse.web_search_enabled}`);
                console.log(`💬 Response Preview: ${aiResponse.content.substring(0, 100)}...`);
                
                if (aiResponse.web_search_enabled) {
                    console.log(`🎉 WEB SEARCH TRIGGERED!`);
                } else {
                    console.log(`❌ Web search not triggered`);
                }
            } else {
                console.log(`❌ Request failed:`, responseJson);
            }
            
        } catch (error) {
            console.log(`❌ Error:`, error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function testCurrentDateSpecific() {
    console.log('\n🗓️ Testing Current Date Query (Your Original Case)...');
    
    const testMessage = {
        userId: testUserId,
        message: "what is today's date?",
        conversationId: 'current-date-test-' + Date.now(),
        provider: 'groq',
        model: 'llama-3.1-8b-instant'
    };
    
    try {
        const response = await fetch(`${baseUrl}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(testMessage)
        });
        
        const responseJson = await response.json();
        
        if (responseJson.success && responseJson.data) {
            const aiResponse = responseJson.data.aiResponse;
            console.log(`✅ Status: ${response.status}`);
            console.log(`🔍 Web Search Enabled: ${aiResponse.web_search_enabled}`);
            console.log(`💬 Full Response: ${aiResponse.content}`);
            
            return aiResponse.web_search_enabled;
        } else {
            console.log(`❌ Request failed:`, responseJson);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error:`, error.message);
        return false;
    }
}

async function main() {
    console.log('=== WEB SEARCH FUNCTIONALITY TEST ===\n');
    
    // Test current date specifically
    const currentDateWorks = await testCurrentDateSpecific();
    
    // Test other web search cases
    await testWebSearchFunctionality();
    
    console.log('\n=== SUMMARY ===');
    if (currentDateWorks) {
        console.log('✅ Web search is working for current date queries');
    } else {
        console.log('❌ Web search is NOT working - needs investigation');
    }
}

// Run the test
main().catch(console.error);