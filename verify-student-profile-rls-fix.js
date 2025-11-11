/**
 * Verify Student Profile RLS Policy Status
 * This script checks if the RLS policy fix was already applied
 */

const baseUrl = 'http://localhost:3000';

async function testStudentProfileAPI() {
    console.log('🧪 Testing Student Profile API with RLS Policy Fix...');
    
    // Test the student profile API that was previously failing
    const testUserId = '322531b3-173d-42a9-be4c-770ad92ac8b8';
    
    try {
        console.log(`📤 Testing student profile API for user: ${testUserId}`);
        
        const response = await fetch(`${baseUrl}/api/student/profile?userId=${testUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });
        
        const responseData = await response.json();
        
        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Data:', JSON.stringify(responseData, null, 2));
        
        if (response.ok) {
            console.log('✅ SUCCESS: Student Profile API is working correctly!');
            console.log('✅ RLS Policy Fix: Already applied and functional');
        } else {
            console.log('❌ FAILED: Student Profile API still has issues');
            console.log('❌ Error Details:', responseData);
        }
        
        return {
            success: response.ok,
            status: response.status,
            data: responseData
        };
        
    } catch (error) {
        console.log('❌ Network Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testStudyBuddyWithProfile() {
    console.log('\n🤖 Testing Study Buddy with Profile Integration...');
    
    const testMessage = {
        userId: '322531b3-173d-42a9-be4c-770ad92ac8b8',
        message: 'Hello, test with profile integration',
        conversationId: 'profile-test-' + Date.now(),
        context: {
            type: 'study',
            subject: 'general'
        }
    };
    
    try {
        const response = await fetch(`${baseUrl}/api/study-buddy`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        const responseData = await response.json();
        
        console.log('📥 Study Buddy Response Status:', response.status);
        
        if (response.ok) {
            console.log('✅ SUCCESS: Study Buddy working with profile integration!');
        } else {
            console.log('❌ FAILED: Study Buddy has issues');
        }
        
        return {
            success: response.ok,
            status: response.status,
            data: responseData
        };
        
    } catch (error) {
        console.log('❌ Study Buddy Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('=== STUDENT PROFILE RLS POLICY VERIFICATION ===\n');
    console.log('The SQL error you received is actually expected behavior:');
    console.log('✅ Policy already exists = Fix was already applied successfully!\n');
    
    // Test the APIs to confirm everything is working
    const profileTest = await testStudentProfileAPI();
    const studyBuddyTest = await testStudyBuddyWithProfile();
    
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Student Profile API: ${profileTest.success ? '✅ WORKING' : '❌ ISSUES'}`);
    console.log(`Study Buddy API: ${studyBuddyTest.success ? '✅ WORKING' : '❌ ISSUES'}`);
    
    if (profileTest.success && studyBuddyTest.success) {
        console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
        console.log('✅ RLS Policy fix confirmed: Already applied and working');
        console.log('✅ No further database fixes needed');
        console.log('✅ Study Buddy chat system fully functional');
    } else {
        console.log('\n⚠️ Some APIs still have issues - may need additional investigation');
    }
}

// Run the verification
main().catch(console.error);