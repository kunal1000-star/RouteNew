// Diagnostic Logging for Teaching Engine Investigation
// =====================================================
// This file provides enhanced logging to validate assumptions about 
// why the teaching engine is providing generic responses

// Enhanced Query Classification Logging
function logQueryClassification(message, userId) {
  const lowerMessage = message.toLowerCase();
  const requestId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🔍 [${requestId}] QUERY CLASSIFICATION DEBUG`);
  console.log(`📝 User: ${userId.substring(0, 8)}...`);
  console.log(`📋 Message: "${message.substring(0, 150)}${message.length > 150 ? '...' : ''}"`);
  console.log(`📏 Message Length: ${message.length} characters`);
  
  // Teaching keyword detection
  const teachingKeywords = [
    'explain', 'teach', 'learning', 'study', 'help me understand',
    'how does', 'what is', 'why does', 'thermo', 'sajha', 'physics',
    'chemistry', 'math', 'biology', 'integration', 'calculus'
  ];
  
  const detectedTeachingKeywords = teachingKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Personal query detection
  const personalKeywords = [
    'my', 'i am', 'my name', 'do you know', 'who am i', 'what is my',
    'remember', 'recall', 'earlier', 'before', 'previous', 'last time'
  ];
  
  const detectedPersonalKeywords = personalKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  console.log(`🎯 Teaching Keywords Found:`, detectedTeachingKeywords);
  console.log(`👤 Personal Keywords Found:`, detectedPersonalKeywords);
  
  const isTeachingQuery = detectedTeachingKeywords.length > 0;
  const isPersonalQuery = detectedPersonalKeywords.length > 0;
  
  console.log(`✅ Classification Results:`, {
    isTeachingQuery,
    isPersonalQuery,
    queryType: isTeachingQuery ? 'teaching' : isPersonalQuery ? 'personal' : 'general'
  });
  
  return {
    requestId,
    isTeachingQuery,
    isPersonalQuery,
    detectedTeachingKeywords,
    detectedPersonalKeywords
  };
}

// Subject Detection Debugging
function logSubjectDetection(message, classification) {
  const lowerMessage = message.toLowerCase();
  console.log(`\n🔬 SUBJECT DETECTION DEBUG`);
  
  const subjectPatterns = {
    thermodynamics: ['thermo', 'sajha do', 'heat', 'energy', 'entropy'],
    mathematics: ['math', 'calculus', 'integration', 'algebra', 'equation'],
    physics: ['physics', 'force', 'motion', 'mechanics', 'gravity'],
    chemistry: ['chemistry', 'atom', 'molecule', 'bond', 'reaction'],
    biology: ['biology', 'photosynthesis', 'cell', 'organism', 'evolution'],
    history: ['history', 'ancient', 'war', 'civilization', 'historical'],
    geography: ['geography', 'country', 'continent', 'climate', 'map']
  };
  
  const detectedSubjects = [];
  for (const [subject, patterns] of Object.entries(subjectPatterns)) {
    const found = patterns.filter(pattern => lowerMessage.includes(pattern));
    if (found.length > 0) {
      detectedSubjects.push({ subject, keywords: found });
    }
  }
  
  console.log(`📚 Detected Subjects:`, detectedSubjects);
  
  if (classification.isTeachingQuery && detectedSubjects.length === 0) {
    console.log(`⚠️  WARNING: Teaching query detected but no specific subject found!`);
    console.log(`   This will trigger the generic fallback response.`);
  }
  
  return detectedSubjects;
}

// Memory Context Integration Debugging
function logMemoryContextDebug(userId, isPersonalQuery, memoryResult) {
  console.log(`\n🧠 MEMORY CONTEXT DEBUG`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`❓ Is Personal Query: ${isPersonalQuery}`);
  
  if (memoryResult) {
    console.log(`💾 Memory Search Results:`, {
      memoriesFound: memoryResult.memories?.length || 0,
      contextLength: memoryResult.contextString?.length || 0,
      personalFacts: memoryResult.personalFacts?.length || 0
    });
    
    if (memoryResult.memories && memoryResult.memories.length > 0) {
      console.log(`📋 Sample Memory:`, memoryResult.memories[0]?.content?.substring(0, 100) + '...');
    }
  } else {
    console.log(`❌ No memory context available`);
  }
}

// Teaching Response Generation Debugging
function logTeachingResponseDebug(message, classification, subjects, memoryContext) {
  console.log(`\n👨‍🏫 TEACHING RESPONSE DEBUG`);
  console.log(`📋 Message: "${message.substring(0, 100)}..."`);
  console.log(`🎯 Classification:`, classification);
  console.log(`📚 Subjects:`, subjects.map(s => s.subject));
  
  const willUseGeneric = !classification.isTeachingQuery || subjects.length === 0;
  console.log(`🔄 Will Use Generic Response: ${willUseGeneric}`);
  
  if (willUseGeneric) {
    console.log(`⚠️  WARNING: This request will trigger the generic "Learning & Study Guide" response!`);
    console.log(`   Reasons:`, [
      !classification.isTeachingQuery && 'Not detected as teaching query',
      subjects.length === 0 && 'No specific subject detected',
    ].filter(Boolean));
  }
  
  return willUseGeneric;
}

// Feature Flag Debugging
function logFeatureFlagDebug() {
  console.log(`\n🚩 FEATURE FLAG DEBUG`);
  
  // Check if feature flags are properly loaded
  try {
    const featureFlags = window?.__NEXT_DATA__?.props?.pageProps?.featureFlags;
    console.log(`🎯 Client Feature Flags:`, featureFlags);
  } catch (error) {
    console.log(`❌ Could not access client feature flags:`, error.message);
  }
  
  // Check server-side feature flags
  console.log(`🔧 Server Environment Variables:`, {
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasCerebrasKey: !!process.env.CEREBRAS_API_KEY,
    hasCohereKey: !!process.env.COHERE_API_KEY,
    hasMistralKey: !!process.env.MISTRAL_API_KEY,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY
  });
}

// Error Handling Debugging
function logErrorHandlingDebug(error, context) {
  console.log(`\n❌ ERROR HANDLING DEBUG`);
  console.log(`🚨 Error:`, error.message);
  console.log(`📍 Context:`, context);
  console.log(`📋 Stack:`, error.stack);
  
  if (error.message.includes('teaching') || error.message.includes('generate')) {
    console.log(`⚠️  ERROR RELATED TO TEACHING ENGINE DETECTED!`);
  }
}

// Main Diagnostic Function
function runTeachingEngineDiagnostic(message, userId, context = {}) {
  console.log(`\n🚀 ===== TEACHING ENGINE DIAGNOSTIC =====`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🆔 Session: ${context.sessionId || 'unknown'}`);
  
  try {
    // Step 1: Query Classification
    const classification = logQueryClassification(message, userId);
    
    // Step 2: Subject Detection
    const subjects = logSubjectDetection(message, classification);
    
    // Step 3: Memory Context (if available)
    if (context.memoryResult) {
      logMemoryContextDebug(userId, classification.isPersonalQuery, context.memoryResult);
    }
    
    // Step 4: Response Generation Decision
    const willUseGeneric = logTeachingResponseDebug(message, classification, subjects, context.memoryResult);
    
    // Step 5: Feature Flags
    logFeatureFlagDebug();
    
    // Summary
    console.log(`\n📊 DIAGNOSTIC SUMMARY`);
    console.log(`✅ Query Classification: ${classification.queryType}`);
    console.log(`📚 Subject Detection: ${subjects.length > 0 ? subjects.map(s => s.subject).join(', ') : 'None'}`);
    console.log(`🔄 Generic Response: ${willUseGeneric ? 'YES ⚠️' : 'NO ✅'}`);
    
    if (willUseGeneric) {
      console.log(`\n🔧 RECOMMENDED ACTIONS:`);
      if (!classification.isTeachingQuery) {
        console.log(`   1. Expand teaching keyword detection patterns`);
        console.log(`   2. Add more teaching-related keywords to classifier`);
      }
      if (subjects.length === 0) {
        console.log(`   1. Add more subject detection patterns`);
        console.log(`   2. Implement fuzzy matching for subject detection`);
      }
    }
    
    console.log(`🏁 ===== END DIAGNOSTIC =====\n`);
    
    return {
      classification,
      subjects,
      willUseGeneric,
      diagnosticId: `diagnostic-${Date.now()}`
    };
    
  } catch (error) {
    logErrorHandlingDebug(error, { message, userId, context });
    throw error;
  }
}

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logQueryClassification,
    logSubjectDetection,
    logMemoryContextDebug,
    logTeachingResponseDebug,
    logFeatureFlagDebug,
    logErrorHandlingDebug,
    runTeachingEngineDiagnostic
  };
}

// Usage Example:
// runTeachingEngineDiagnostic("Can you explain thermodynamics to me?", "user-123", {
//   sessionId: "session-456",
//   memoryResult: { memories: [], contextString: "", personalFacts: [] }
// });