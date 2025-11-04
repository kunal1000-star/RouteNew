// Simple test for AI Suggestions API
import { generateAllSuggestions, type StudentProfile } from '@/lib/ai/ai-suggestions';

// Test data
const testProfile: StudentProfile = {
  userId: 'test-user-123',
  performanceData: {
    subjectScores: { 'Mathematics': 75, 'Physics': 80, 'Chemistry': 65 },
    weakAreas: ['Organic Chemistry', 'Calculus'],
    strongAreas: ['Physics', 'Mechanics'],
    recentActivities: ['Test completed', 'Study session'],
    studyTime: 120,
    learningStyle: 'visual',
    examTarget: 'JEE 2025',
    currentProgress: { 'Mathematics': 70, 'Physics': 85, 'Chemistry': 60 }
  },
  historicalData: {
    improvementTrends: { 'Mathematics': 5, 'Physics': 10, 'Chemistry': -2 },
    struggleTopics: ['Integration', 'Reaction Mechanisms'],
    successPatterns: ['Morning study', 'Visual aids'],
    timeSpentBySubject: { 'Mathematics': 60, 'Physics': 45, 'Chemistry': 35 }
  }
};

async function testAISuggestions() {
  try {
    console.log('🧪 Testing AI Suggestions Service...');
    
    const suggestions = await generateAllSuggestions(testProfile);
    
    console.log('✅ Generated suggestions:', suggestions.length);
    console.log('📋 Suggestion types:', suggestions.map(s => s.type));
    console.log('🎯 High priority suggestions:', suggestions.filter(s => s.priority === 'high').length);
    
    return {
      success: true,
      suggestions: suggestions.length,
      types: suggestions.map(s => s.type),
      highPriority: suggestions.filter(s => s.priority === 'high').length
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other modules
export { testAISuggestions };

// Run test if called directly
if (require.main === module) {
  testAISuggestions().then(result => {
    console.log('🎉 Test Result:', result);
  });
}
