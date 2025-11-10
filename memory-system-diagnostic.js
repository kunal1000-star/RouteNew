// Quick diagnostic to identify the root cause of API failures
const fetch = require('node:fetch');

const CONFIG = {
    baseUrl: 'http://localhost:3000'
};

async function diagnosticTest() {
    console.log('🔍 MEMORY SYSTEM DIAGNOSTIC\n');
    
    const tests = [
        { name: 'Health Check', endpoint: '/api/chat/health-check', method: 'GET' },
        { name: 'Memory Storage', endpoint: '/api/ai/memory-storage', method: 'POST', data: { userId: 'test', message: 'test' } },
        { name: 'Semantic Search', endpoint: '/api/ai/semantic-search', method: 'POST', data: { userId: 'test', query: 'test' } },
        { name: 'Personalized AI', endpoint: '/api/ai/personalized', method: 'POST', data: { userId: 'test', message: 'test' } },
        { name: 'Study Buddy', endpoint: '/api/study-buddy', method: 'POST', data: { userId: 'test', message: 'test' } }
    ];

    for (const test of tests) {
        console.log(`Testing: ${test.name} (${test.method} ${test.endpoint})`);
        
        try {
            const options = {
                method: test.method,
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            };
            
            if (test.data) {
                options.body = JSON.stringify(test.data);
            }
            
            const response = await fetch(`${CONFIG.baseUrl}${test.endpoint}`, options);
            const text = await response.text();
            
            console.log(`  Status: ${response.status}`);
            console.log(`  Response length: ${text.length} characters`);
            
            if (text.length > 0) {
                try {
                    const json = JSON.parse(text);
                    console.log(`  ✓ Valid JSON response`);
                    console.log(`  Response: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
                } catch (e) {
                    console.log(`  ❌ Invalid JSON: ${e.message}`);
                    console.log(`  Raw response: "${text.substring(0, 100)}..."`);
                }
            } else {
                console.log(`  ❌ Empty response`);
            }
            
        } catch (error) {
            console.log(`  ❌ Connection error: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Check if server is running
    console.log('Checking server status...');
    try {
        const response = await fetch('http://localhost:3000', { timeout: 5000 });
        console.log(`✓ Server is running on port 3000 (Status: ${response.status})`);
    } catch (error) {
        console.log(`❌ Server not responding: ${error.message}`);
        console.log('  Make sure to run "npm run dev" first');
    }
}

diagnosticTest().catch(console.error);