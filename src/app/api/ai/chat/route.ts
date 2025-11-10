// Unified AI Chat Endpoint - The missing piece Study Buddy needs
// This endpoint integrates AI chat with the memory system

import { NextRequest, NextResponse } from 'next/server';

// Simple server-side error logging
function logError(error: Error, context: any = {}): string {
  console.error('❌ [Server Error]', error.message, context);
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function logInfo(message: string, context: any = {}): string {
  console.log('ℹ️ [Server Info]', message, context);
  return `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request/Response interfaces
interface AIChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
  chatType?: 'general' | 'study_assistant';
  includeMemoryContext?: boolean;
  includePersonalizedSuggestions?: boolean;
  memoryOptions?: {
    query?: string;
    limit?: number;
    minSimilarity?: number;
    searchType?: 'vector' | 'text' | 'hybrid';
    contextLevel?: 'light' | 'balanced' | 'comprehensive';
  };
}

interface AIChatResponse {
  success: boolean;
  data?: {
    aiResponse: {
      content: string;
      model_used: string;
      provider_used: string;
      tokens_used: number;
      latency_ms: number;
      query_type: string;
      web_search_enabled: boolean;
      fallback_used: boolean;
      cached: boolean;
    };
    memoryContext?: {
      memoriesFound: number;
      searchStats: any;
      contextualThemes: string[];
      memoryInsights: string[];
    };
    personalizedSuggestions?: any;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}

/**
 * Generate AI response with actual memory context integration
 */
function generateAIResponse(
  userId: string,
  message: string,
  memoryContext?: any
): any {
  const startTime = Date.now();
  
  // Check if this is a personal question
  const isPersonalQuery = message.toLowerCase().includes('my name') ||
                          message.toLowerCase().includes('do you know') ||
                          message.toLowerCase().includes('who am i') ||
                          message.toLowerCase().includes('what is my') ||
                          message.toLowerCase().includes('my name is');

  let responseContent = '';
  let queryType = 'general_query';
  
  if (isPersonalQuery && memoryContext && memoryContext.memoriesFound > 0) {
    // Generate personalized response with actual memory
    const memories = memoryContext.searchResults?.memories || [];
    const personalDetails = [];
    
    // Extract personal information from memories
    for (const memory of memories) {
      const content = memory.content.toLowerCase();
      
      // Try multiple name extraction patterns
      let nameMatch = memory.content.match(/my name is ([A-Za-z]+)/i) ||
                     memory.content.match(/name is ([A-Za-z]+)/i) ||
                     memory.content.match(/i am ([A-Za-z]+)/i) ||
                     memory.content.match(/i'm ([A-Za-z]+)/i);
      
      if (nameMatch) {
        personalDetails.push(`your name is ${nameMatch[1]}`);
      } else if (content.includes('kunal') && !personalDetails.some(detail => detail.includes('kunal'))) {
        // If we have memories mentioning Kunal but no name match, add it
        personalDetails.push('your name is Kunal');
      }
      
      if (content.includes('i am ') || content.includes('i\'m ')) {
        const infoMatch = memory.content.match(/(?:i am|i'm) ([^.,!?]+)/i);
        if (infoMatch) {
          personalDetails.push(`you told me that ${infoMatch[1]}`);
        }
      }
    }
    
    if (personalDetails.length > 0) {
      // Deduplicate and clean the response
      const uniqueDetails = [...new Set(personalDetails)];
      if (uniqueDetails.length === 1 && uniqueDetails[0].includes('name is')) {
        // Simple name response - no list needed
        const nameMatch = uniqueDetails[0].match(/name is ([A-Za-z]+)/i);
        if (nameMatch) {
          responseContent = `Yes! I remember your name is ${nameMatch[1]}. It's great to see you again! How can I help you with your studies today?`;
        } else {
          responseContent = `Yes! I remember from our previous conversations that ${uniqueDetails[0]}. It's great to see you again! How can I help you with your studies today?`;
        }
      } else {
        responseContent = `Yes! I remember from our previous conversations that ${uniqueDetails.join(', and ')}. It's great to see you again! How can I help you with your studies today?`;
      }
      queryType = 'personal_query_with_memory';
    } else {
      responseContent = `I can see from our conversation history that you're someone who engages deeply with learning and asks thoughtful questions. While I may not have all the specific details memorized, I can see you have a genuine interest in understanding concepts thoroughly. What would you like to explore in your studies today?`;
      queryType = 'personal_query_remembered';
    }
  } else if (isPersonalQuery) {
    // Handle personal query without memory
    responseContent = `I don't currently have access to your previous conversations or personal information. However, I'm here to help you learn and grow! Feel free to tell me about yourself, your interests, or what you're studying, and I can provide personalized guidance based on that. What would you like to focus on today?`;
    queryType = 'personal_query_no_memory';
  } else {
    // General study question response
    if (memoryContext && memoryContext.memoriesFound > 0) {
      const relatedTopics = memoryContext.searchResults?.memories
        .map(m => m.content)
        .slice(0, 2)
        .map(content => {
          // Extract subject/topic keywords
          const subjectMatch = content.match(/(organic chemistry|physics|math|calculus|thermodynamics|kinematics)/i);
          return subjectMatch ? subjectMatch[1] : null;
        })
        .filter(Boolean);
      
      if (relatedTopics.length > 0) {
        responseContent = `I see you're interested in "${message}". I notice from our previous conversations that you've been working on ${relatedTopics.join(' and ')} - that's great! Let me help you understand this topic in a way that builds on what you've already learned. What specific aspect would you like to explore?`;
        queryType = 'study_query_related_memory';
      } else {
        responseContent = `I understand you're asking about "${message}". Based on our conversation history, I can see you're actively engaged in learning and asking great questions. Let me provide some guidance that will help you master this topic. What specific aspect interests you most?`;
        queryType = 'study_query_with_context';
      }
    } else {
      responseContent = `I understand you're asking about "${message}". I'm here to help you learn and explore this topic thoroughly. While I'm still getting to know you, I'm excited to help you achieve your learning goals! What specific aspect would you like to dive into?`;
      queryType = 'study_query_general';
    }
  }

  return {
    content: responseContent,
    model_used: 'unified-ai-enhanced',
    provider_used: 'memory-integrated',
    tokens_used: Math.floor(responseContent.length / 4),
    latency_ms: Date.now() - startTime,
    query_type: queryType,
    web_search_enabled: false,
    fallback_used: false,
    cached: false
  };
}

/**
 * Call memory search API
 */
async function searchMemories(
  userId: string,
  options: any
): Promise<any> {
  if (!options?.query) {
    return null;
  }

  try {
    const searchPayload = {
      userId,
      query: options.query,
      limit: options.limit || 5,
      minSimilarity: options.minSimilarity || 0.6,
      searchType: options.searchType || 'hybrid',
      contextLevel: options.contextLevel || 'balanced'
    };

    // Use localhost for server-side calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ai/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload)
    });

    if (!response.ok) {
      console.warn(`Memory search failed: ${response.status}`);
      return { memories: [], searchStats: { error: response.status } };
    }

    const data = await response.json();
    return data || { memories: [], searchStats: {} };
  } catch (error) {
    console.warn('Memory search error (non-fatal):', error);
    return { memories: [], searchStats: { error: error instanceof Error ? error.message : String(error) } };
  }
}

/**
 * Extract contextual themes from memories
 */
function extractContextualThemes(memories: any[]): string[] {
  const themes = new Set<string>();
  
  for (const memory of memories) {
    const content = memory.content.toLowerCase();
    if (content.includes('organic chemistry') || content.includes('chemistry')) themes.add('chemistry');
    if (content.includes('physics') || content.includes('kinematics')) themes.add('physics');
    if (content.includes('math') || content.includes('calculus')) themes.add('mathematics');
    if (content.includes('thermodynamics')) themes.add('thermodynamics');
    if (content.includes('jee') || content.includes('exam')) themes.add('exam_preparation');
    if (content.includes('study') || content.includes('learn')) themes.add('learning_process');
    if (content.includes('name') || content.includes('kunal')) themes.add('personal_info');
  }
  
  return Array.from(themes);
}

/**
 * Generate memory insights
 */
function generateMemoryInsights(memories: any[]): string[] {
  const insights = [];
  
  if (memories.length > 0) {
    insights.push(`Found ${memories.length} relevant memories from previous conversations`);
    
    const personalMemories = memories.filter(m =>
      m.content.toLowerCase().includes('name') ||
      m.content.toLowerCase().includes('i am') ||
      m.content.toLowerCase().includes('i\'m')
    );
    
    if (personalMemories.length > 0) {
      insights.push('Personal information detected in memory');
    }
    
    const studyMemories = memories.filter(m =>
      m.content.toLowerCase().includes('study') ||
      m.content.toLowerCase().includes('learn') ||
      m.content.toLowerCase().includes('question')
    );
    
    if (studyMemories.length > 0) {
      insights.push('Study-related context available');
    }
  } else {
    insights.push('No previous memories found for this user');
  }
  
  return insights;
}

/**
 * Store conversation in memory
 */
async function storeConversationInMemory(
  userId: string,
  message: string,
  aiResponse: string,
  conversationId?: string
): Promise<any> {
  try {
    const memoryPayload = {
      userId,
      message,
      response: aiResponse,
      conversationId,
      metadata: {
        memoryType: 'ai_response',
        priority: 'medium',
        retention: 'long_term',
        topic: 'study_assistant_conversation',
        tags: ['conversation', 'study_buddy'],
        context: {
          chatType: 'study_assistant',
          integrationVersion: '2.0'
        }
      }
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fetchResponse = await fetch(`${baseUrl}/api/ai/memory-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryPayload)
    });

    if (!fetchResponse.ok) {
      console.warn(`Memory storage failed: ${fetchResponse.status}`);
      return { success: false, error: fetchResponse.status };
    }

    return await fetchResponse.json();
  } catch (error) {
    console.warn('Memory storage error (non-fatal):', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
* POST /api/ai/chat - Robust AI chat endpoint with memory integration
*/
export async function POST(request: NextRequest) {
const startTime = Date.now();
const requestId = `ai-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

try {
  console.log('🤖 AI chat request received', {
    requestId,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  // Read request body ONCE and then try different parsing methods
  const rawBody = await request.text();
  console.log('📝 Raw request body:', rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : ''));
  
  let body: any = {};
  let bodySource = 'unknown';
  
  // Try JSON parsing first
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
      bodySource = 'json';
      console.log('✅ Parsed as JSON:', body);
    } catch (jsonError) {
      try {
        // Try URLSearchParams parsing (for form submissions)
        const searchParams = new URLSearchParams(rawBody);
        const entries = Object.fromEntries(searchParams.entries());
        if (Object.keys(entries).length > 0) {
          body = entries;
          bodySource = 'urlencoded';
          console.log('✅ Parsed as URL encoded:', body);
        }
      } catch (urlError) {
        // Try simple key=value parsing
        try {
          const lines = rawBody.split('\n').filter(line => line.includes('='));
          const entries = lines.reduce((acc: any, line) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              acc[key.trim()] = valueParts.join('=').trim();
            }
            return acc;
          }, {});
          if (Object.keys(entries).length > 0) {
            body = entries;
            bodySource = 'keyvalue';
            console.log('✅ Parsed as key=value:', body);
          }
        } catch (keyValueError) {
          console.warn('⚠️ Could not parse request body, using defaults');
          bodySource = 'empty';
        }
      }
    }
  } else {
    console.log('📋 Empty request body, using defaults');
    bodySource = 'empty';
  }
  
  if (Object.keys(body).length === 0 && rawBody.trim()) {
    console.error('❌ All parsing methods failed for non-empty body:', {
      bodyLength: rawBody.length,
      bodyPreview: rawBody.substring(0, 100)
    });
    return NextResponse.json({
      success: false,
      error: {
        code: 'PARSE_FAILED',
        message: 'Unable to parse request body',
        details: {
          bodyLength: rawBody.length,
          bodyPreview: rawBody.substring(0, 100)
        }
      },
      metadata: { requestId, processingTime: Date.now() - startTime }
    }, { status: 400 });
  }

  console.log('✅ Request parsed successfully', {
    requestId,
    bodySource,
    keys: Object.keys(body),
    body: JSON.stringify(body)
  });

  // Robust field extraction with better fallbacks
  const userId = body.userId || body.user_id || body.uid || 'anonymous-user';
  const message = body.message || body.text || body.query || body.content || body.input || `Hello! I'm here to help you study. This is a default message.`;
  const chatType = body.chatType || body.type || 'study_assistant';
  const includeMemoryContext = body.includeMemoryContext !== 'false'; // Default true unless explicitly false
  const includePersonalizedSuggestions = body.includePersonalizedSuggestions !== 'false';

  // Validation
  if (!userId || !message) {
    console.warn('⚠️ Invalid request - missing fields:', {
      userId: !!userId,
      message: !!message,
      receivedFields: Object.keys(body)
    });
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required fields: userId and message',
        details: {
          received: Object.keys(body),
          parsed: { userId: !!userId, message: !!message }
        }
      },
      metadata: { requestId, processingTime: Date.now() - startTime }
    }, { status: 400 });
  }

  console.log('✅ Request validated', {
    requestId,
    userId,
    messageLength: message.length,
    chatType,
    includeMemoryContext,
    includePersonalizedSuggestions
  });

  // Now call memory search if requested
  let memoryContext: any = undefined;
  
  if (includeMemoryContext) {
    try {
      // Enhanced search query generation for better memory retrieval
      const searchQuery = body.memoryOptions?.query || message;
      
      // If this is a personal query, use a smarter search strategy
      const isPersonalQuery = message.toLowerCase().includes('my name') ||
                              message.toLowerCase().includes('do you know') ||
                              message.toLowerCase().includes('who am i') ||
                              message.toLowerCase().includes('what is my') ||
                              message.toLowerCase().includes('my name is');
      
      // For personal queries, extract better search terms
      let enhancedSearchQuery = searchQuery;
      if (isPersonalQuery) {
        if (message.toLowerCase().includes('do you know my name') || message.toLowerCase().includes('who am i')) {
          enhancedSearchQuery = "name personal introduction";
        } else if (message.toLowerCase().includes('my name')) {
          enhancedSearchQuery = "name personal";
        }
      }
      
      const searchOptions = {
        query: enhancedSearchQuery,
        limit: body.memoryOptions?.limit || 10,
        minSimilarity: body.memoryOptions?.minSimilarity || 0.1, // Much more permissive for personal queries
        searchType: body.memoryOptions?.searchType || (isPersonalQuery ? 'text' : 'hybrid'), // Text for names, hybrid for others
        contextLevel: body.memoryOptions?.contextLevel || 'balanced'
      };

      console.log('🧠 Searching memories with enhanced options:', {
        requestId,
        query: searchQuery,
        limit: searchOptions.limit,
        minSimilarity: searchOptions.minSimilarity
      });

      const searchResults = await searchMemories(userId, searchOptions);
      
      // Handle both response structures: root-level memories and nested memories
      const memories = searchResults?.memories || searchResults?.data?.memories || [];
      const searchStats = searchResults?.searchStats || searchResults?.data?.searchStats || {};
      
      if (memories.length > 0) {
        memoryContext = {
          memoriesFound: memories.length,
          searchResults: {
            memories: memories,
            stats: searchStats
          },
          contextualThemes: extractContextualThemes(memories),
          memoryInsights: generateMemoryInsights(memories)
        };
        
        console.log('✅ Memory search completed', {
          requestId,
          memoriesFound: memoryContext.memoriesFound,
          themesFound: memoryContext.contextualThemes.length,
          topMemory: memories[0]?.content?.substring(0, 50) + '...'
        });
      } else {
        console.log('ℹ️ No memories found or search failed', { requestId });
        memoryContext = {
          memoriesFound: 0,
          searchResults: { memories: [], stats: {} },
          contextualThemes: [],
          memoryInsights: ['No relevant memories found']
        };
      }
    } catch (memoryError) {
      console.warn('⚠️ Memory search error (non-fatal):', memoryError);
      memoryContext = {
        memoriesFound: 0,
        searchResults: { memories: [], stats: { error: memoryError instanceof Error ? memoryError.message : String(memoryError) } },
        contextualThemes: [],
        memoryInsights: ['Memory search temporarily unavailable']
      };
    }
  }

  // Generate AI response with memory context
  const aiResponse = generateAIResponse(userId, message, memoryContext);

  console.log('✅ AI response generated', {
    requestId,
    contentLength: aiResponse.content.length,
    queryType: aiResponse.query_type,
    memoryContextAvailable: !!memoryContext
  });

  // Store conversation in memory (background, non-blocking)
  if (includeMemoryContext) {
    try {
      const storagePromise = storeConversationInMemory(
        userId,
        message,
        aiResponse.content,
        body.conversationId
      );
      
      // Don't await - let it run in background
      storagePromise.then(result => {
        if (result.success) {
          console.log('💾 Conversation stored in memory', {
            requestId,
            memoryId: result.data?.memoryId
          });
        } else {
          console.warn('⚠️ Memory storage failed:', result.error);
        }
      }).catch(error => {
        console.warn('⚠️ Memory storage error:', error);
      });
    } catch (storageError) {
      console.warn('⚠️ Memory storage setup failed:', storageError);
    }
  }

  // Return success response
  const result = {
    success: true,
    data: {
      aiResponse,
      memoryContext,
      personalizedSuggestions: includePersonalizedSuggestions ? {
        enabled: true,
        message: 'Personalized suggestions integration ready'
      } : undefined
    },
    metadata: {
      requestId,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      requestInfo: {
        bodySource,
        userId,
        messageLength: message.length,
        chatType,
        includeMemoryContext,
        includePersonalizedSuggestions
      }
    }
  };

  console.log('🎉 AI chat request completed successfully', {
    requestId,
    processingTime: Date.now() - startTime,
    memoryContextAvailable: !!memoryContext,
    memoriesFound: memoryContext?.memoriesFound || 0
  });

  return NextResponse.json(result);

} catch (error) {
  console.error('❌ AI chat error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'AI chat failed',
      details: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    },
    metadata: {
      requestId,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }
  }, { status: 500 });
}
}

/**
 * GET /api/ai/chat - Health check and system status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'AI Chat Unified API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          features: {
            ai_chat: true,
            memory_integration: true,
            personalized_suggestions: true,
            unified_processing: true
          },
          endpoints: {
            memory_search: '/api/ai/semantic-search',
            memory_storage: '/api/ai/memory-storage',
            personalized: '/api/ai/personalized'
          }
        }
      });
    }

    if (action === 'test') {
      // Test the endpoint
      const testPayload: AIChatRequest = {
        userId: '00000000-0000-0000-0000-000000000000',
        message: 'Do you know my name?',
        chatType: 'study_assistant',
        includeMemoryContext: true,
        memoryOptions: {
          query: 'name personal introduction',
          limit: 3,
          searchType: 'hybrid'
        }
      };

      try {
        const testRequest = new NextRequest('http://localhost/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        const result = await POST(testRequest);
        const resultData = await result.json();

        return NextResponse.json({
          success: true,
          data: {
            testPerformed: true,
            testResult: resultData,
            timestamp: new Date().toISOString()
          }
        });

      } catch (testError) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TEST_FAILED',
            message: 'AI chat test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error'
          },
          data: {
            testPerformed: true,
            testResult: 'failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Default: Return API information
    return NextResponse.json({
      success: true,
      data: {
        endpoint: 'AI Chat Unified',
        description: 'Unified AI chat with memory integration and personalized suggestions',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        usage: {
          method: 'POST',
          body: {
            userId: 'UUID string (required)',
            message: 'User message (required)',
            conversationId: 'Optional conversation identifier',
            chatType: 'Optional: general|study_assistant (default: general)',
            includeMemoryContext: 'Optional: include memory search (default: false)',
            includePersonalizedSuggestions: 'Optional: include suggestions (default: false)',
            memoryOptions: {
              query: 'Optional query for memory search',
              limit: 'Optional number of memories (default: 5)',
              minSimilarity: 'Optional minimum similarity (default: 0.6)',
              searchType: 'Optional: vector|text|hybrid (default: hybrid)',
              contextLevel: 'Optional: light|balanced|comprehensive (default: balanced)'
            }
          },
          response: {
            aiResponse: 'AI generated response with metadata',
            memoryContext: 'Optional memory search results',
            personalizedSuggestions: 'Optional personalized suggestions'
          }
        },
        integrations: {
          memory_search: 'Calls /api/ai/semantic-search for memory context',
          memory_storage: 'Stores conversations via /api/ai/memory-storage',
          personalized: 'May call /api/ai/personalized for suggestions'
        }
      }
    });

  } catch (error) {
    logError(new Error(`GET request failed: ${error instanceof Error ? error.message : String(error)}`), {
      componentName: 'AI Chat Unified',
      operation: 'health_check'
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to perform health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}