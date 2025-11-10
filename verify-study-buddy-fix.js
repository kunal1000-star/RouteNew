#!/usr/bin/env node

/**
 * Study Buddy API Configuration Check
 * ===================================
 * 
 * This script checks if the Study Buddy API endpoint is accessible and
 * has the proper memory integration structure
 */

const http = require('http');

async function checkStudyBuddyAPI() {
  console.log('🔍 Checking Study Buddy API Configuration...\n');

  try {
    // 1. Check if the API endpoint is accessible (should return 401 for unauthenticated)
    console.log('1. Testing API endpoint accessibility...');
    
    const response = await fetch('http://localhost:3000/api/study-buddy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test',
        chatType: 'study_assistant'
      })
    });

    console.log(`   API Response Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ API endpoint is accessible and requires authentication');
    } else if (response.status === 400) {
      console.log('   ✅ API endpoint is accessible (bad request expected)');
    } else {
      console.log(`   ⚠️  Unexpected status code: ${response.status}`);
    }

    // 2. Check memory context integration
    console.log('\n2. Checking memory integration code...');
    
    // Read the Study Buddy API file to verify memory integration
    const fs = require('fs');
    const apiFile = fs.readFileSync('src/app/api/study-buddy/route.ts', 'utf8');
    
    // Check for key memory integration components
    const checks = [
      {
        name: 'Memory Context Provider',
        pattern: /memoryContextProvider\.getMemoryContext/,
        found: false
      },
      {
        name: 'Personal Query Detection',
        pattern: /detectPersonalQuestion/,
        found: false
      },
      {
        name: 'Memory References in Response',
        pattern: /memoryReferences.*=.*memoryContext\.memories/,
        found: false
      },
      {
        name: 'Memory Context Returned',
        pattern: /memoriesFound:/,
        found: false
      }
    ];

    checks.forEach(check => {
      check.found = check.pattern.test(apiFile);
      console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'FOUND' : 'MISSING'}`);
    });

    // 3. Check Study Buddy hook fix
    console.log('\n3. Checking Study Buddy hook fix...');
    const hookFile = fs.readFileSync('src/hooks/use-study-buddy.ts', 'utf8');
    
    const hookChecks = [
      {
        name: 'Uses Study Buddy API endpoint',
        pattern: /\/api\/study-buddy/,
        found: false
      },
      {
        name: 'Passes isPersonalQuery parameter',
        pattern: /isPersonalQuery:\s*isPersonalQuery/,
        found: false
      },
      {
        name: 'Handles memory references',
        pattern: /memory_references.*data\.data\.response/,
        found: false
      }
    ];

    hookChecks.forEach(check => {
      check.found = check.pattern.test(hookFile);
      console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'FOUND' : 'MISSING'}`);
    });

    // 4. Summary
    console.log('\n4. Configuration Summary:');
    const allAPIChecksPassed = checks.every(c => c.found);
    const allHookChecksPassed = hookChecks.every(c => c.found);
    
    console.log(`   Memory Integration (API): ${allAPIChecksPassed ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    console.log(`   Study Buddy Hook Fix: ${allHookChecksPassed ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
    
    const overallStatus = allAPIChecksPassed && allHookChecksPassed;
    console.log(`   Overall Status: ${overallStatus ? '✅ READY FOR TESTING' : '❌ NEEDS WORK'}`);

    if (overallStatus) {
      console.log('\n🎉 Study Buddy Memory Fix: IMPLEMENTATION COMPLETE');
      console.log('   The Study Buddy should now:');
      console.log('   ✅ Call the correct API endpoint with memory integration');
      console.log('   ✅ Detect personal questions and retrieve relevant memories');
      console.log('   ✅ Generate personalized responses instead of generic ones');
      console.log('   ✅ Show memory references in the chat interface');
    } else {
      console.log('\n⚠️  Study Buddy Memory Fix: IMPLEMENTATION INCOMPLETE');
      if (!allAPIChecksPassed) {
        console.log('   - Memory integration code may be missing in API');
      }
      if (!allHookChecksPassed) {
        console.log('   - Study Buddy hook may not be calling the correct endpoint');
      }
    }

    return overallStatus;

  } catch (error) {
    console.error('❌ Configuration check failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Note: This is expected if the Next.js server is not running.');
      console.log('   Run "npm run dev" to start the server and test the API.');
    }
    
    return false;
  }
}

// Run the check
if (require.main === module) {
  checkStudyBuddyAPI()
    .then(success => {
      console.log(`\n🏁 Configuration check: ${success ? 'PASS' : 'NEEDS ATTENTION'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Check crashed:', error);
      process.exit(1);
    });
}

module.exports = { checkStudyBuddyAPI };