/**
 * Test Model Selection Functionality
 */

const baseUrl = 'http://localhost:3000';
const testUserId = 'test-user-123';

async function testModelSelection() {
    console.log('🤖 Testing Model Selection Functionality...');
    
    // Test cases for model selection
    const testCases = [
        {
            name: "Groq with specific model",
            provider: "groq",
            model: "llama-3.1-8b-instant",
            expected: "Should use llama-3.1-8b-instant"
        },
        {
            name: "Gemini with new model",
            provider: "gemini", 
            model: "gemini-2.5-flash",
            expected: "Should use gemini-2.5-flash"
        },
        {
            name: "Groq with different model",
            provider: "groq",
            model: "mixtral-8x7b-32768",
            expected: "Should use mixtral-8x7b-32768"
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📤 Testing: ${testCase.name}`);
        console.log(`Provider: ${testCase.provider}, Model: ${testCase.model}`);
        console.log(`Expected: ${testCase.expected}`);
        
        const testMessage = {
            userId: testUserId,
            message: "Hello, this is a model selection test",
            conversationId: 'model-test-' + Date.now(),
            provider: testCase.provider,
            model: testCase.model
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
                console.log(`🎯 Model Used: ${aiResponse.model_used}`);
                console.log(`📡 Provider: ${aiResponse.provider_used}`);
                
                // Check if the model selection worked
                if (aiResponse.model_used === testCase.model) {
                    console.log(`🎉 SUCCESS: Model selection working correctly!`);
                } else {
                    console.log(`❌ FAILED: Expected ${testCase.model}, got ${aiResponse.model_used}`);
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

async function testNewGeminiModels() {
    console.log('\n🆕 Testing New Gemini Models...');
    
    const geminiTests = [
        {
            name: "Gemini 2.5 Flash",
            provider: "gemini",
            model: "gemini-2.5-flash",
            expected: "gemini-2.5-flash"
        },
        {
            name: "Gemini 2.0 Flash Lite", 
            provider: "gemini",
            model: "gemini-2.0-flash-lite",
            expected: "gemini-2.0-flash-lite"
        }
    ];
    
    for (const test of geminiTests) {
        console.log(`\n📤 Testing: ${test.name}`);
        
        const testMessage = {
            userId: testUserId,
            message: "Test the new Gemini model",
            conversationId: 'gemini-test-' + Date.now(),
            provider: test.provider,
            model: test.model
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
                console.log(`🎯 Model Used: ${aiResponse.model_used}`);
                
                if (aiResponse.model_used === test.expected) {
                    console.log(`🎉 SUCCESS: ${test.name} working!`);
                } else {
                    console.log(`⚠️  Model might not be available, used: ${aiResponse.model_used}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error:`, error.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    console.log('=== MODEL SELECTION FUNCTIONALITY TEST ===\n');
    
    // Test model selection with specific providers
    await testModelSelection();
    
    // Test new Gemini models
    await testNewGeminiModels();
    
    console.log('\n=== MODEL SELECTION TEST COMPLETE ===');
}

// Run the test
main().catch(console.error);