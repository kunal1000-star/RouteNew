// Main Study Buddy Chat Endpoint - Unified interface for study buddy functionality
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { memoryContextProvider } from '@/lib/ai/memory-context-provider';

function getDbForRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== STUDY BUDDY DEBUG ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request method:', request.method);
    
    // Read body as text first, then parse JSON
    const text = await request.text();
    console.log('Raw text:', text);
    
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }
    
    let body: any = {};
    try {
      body = JSON.parse(text);
      console.log('Successfully parsed JSON:', body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format', rawText: text },
        { status: 400 }
      );
    }
    
    const { message, conversationId, userId, context, provider, model } = body || {};
    console.log('Parsed body parts:', {
      hasMessage: !!message,
      messageType: typeof message,
      conversationId,
      userId,
      provider,
      model,
      context
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Derive authenticated user from Supabase JWT
    const dbAuth = getDbForRequest(request);
    const authenticatedUserId = dbAuth ? (await dbAuth.auth.getUser()).data.user?.id : null;
    
    // Use provided userId, or authenticated user, or fallback to valid UUID
    const finalUserId = userId || authenticatedUserId || '550e8400-e29b-41d4-a716-446655440000';

    // Log for debugging
    console.log('Study Buddy Request:', {
      hasAuth: !!dbAuth,
      hasAuthenticatedUser: !!authenticatedUserId,
      finalUserId,
      messagePreview: message.substring(0, 50)
    });

    // Get base URL for internal calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Determine if this is a study-specific query
    const isStudyQuery = 
      message.toLowerCase().includes('study') ||
      message.toLowerCase().includes('jee') ||
      message.toLowerCase().includes('exam') ||
      message.toLowerCase().includes('physics') ||
      message.toLowerCase().includes('chemistry') ||
      message.toLowerCase().includes('math') ||
      message.toLowerCase().includes('thermodynamic') ||
      message.toLowerCase().includes('sajha') ||
      message.toLowerCase().includes('teach') ||
      context?.type === 'study';

    // Detect if this is a personal question (for memory integration)
    const isPersonalQuery =
      message.toLowerCase().includes('my name') ||
      message.toLowerCase().includes('do you know') ||
      message.toLowerCase().includes('who am i') ||
      message.toLowerCase().includes('what is my') ||
      message.toLowerCase().includes('mera') ||
      message.toLowerCase().includes('my performance') ||
      message.toLowerCase().includes('my progress') ||
      message.toLowerCase().includes('how am i doing');

    console.log('Personal query detection:', { isPersonalQuery, messagePreview: message.substring(0, 50) });

    // Get memory context for personal queries (like the debug version)
    let memoryContext = null;
    let memoryResult = null;
    
    if (isPersonalQuery && finalUserId) {
      try {
        console.log('🧠 Getting memory context for personal query...');
        memoryResult = await memoryContextProvider.getMemoryContext({
          userId: finalUserId,
          query: message,
          chatType: 'study_assistant',
          isPersonalQuery: true,
          contextLevel: 'comprehensive',
          limit: 8
        });
        
        if (memoryResult?.contextString) {
          memoryContext = memoryResult;
          console.log('✅ Memory context retrieved:', {
            memoriesFound: memoryResult.memories?.length || 0,
            contextLength: memoryResult.contextString.length,
            personalFactsCount: memoryResult.personalFacts?.length || 0
          });
        }
      } catch (memoryError) {
        console.error('❌ Memory context retrieval failed:', memoryError);
      }
    }

    // Enhanced message with memory context for personal queries
    let enhancedMessage = message;
    if (isPersonalQuery && memoryContext?.contextString) {
      enhancedMessage = `${memoryContext.contextString}\n\nUser's current question: ${message}`;
      console.log('📋 Enhanced message created with memory context');
    }

    // Call the unified AI chat endpoint with study-specific context
    const chatResponse = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || ''
      },
      body: JSON.stringify({
        userId: finalUserId,
        message: enhancedMessage,
        conversationId,
        provider,
        model,
        chatType: isStudyQuery ? 'study_buddy' : 'general',
        includeMemoryContext: true,
        includePersonalizedSuggestions: true,
        includeHallucinationPrevention: true,
        context: {
          ...context,
          isStudyBuddy: true,
          queryType: isStudyQuery ? 'educational' : 'general',
          isPersonalQuery,
          provider,
          model,
          memoryOptions: {
            query: isPersonalQuery ? message : undefined,
            limit: 5,
            minSimilarity: 0.1,
            searchType: 'hybrid',
            contextLevel: 'balanced'
          }
        }
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      return NextResponse.json(
        { error: `AI service error: ${errorText}` },
        { status: chatResponse.status }
      );
    }

    const aiResponse = await chatResponse.json();
    
    // Add study buddy specific enhancements with memory integration
    const enhancedResponse = {
      ...aiResponse,
      studyBuddy: {
        isStudyBuddy: true,
        queryType: isStudyQuery ? 'educational' : 'general',
        conversationId: conversationId || aiResponse.conversationId,
        userId: finalUserId,
        timestamp: new Date().toISOString(),
        features: {
          memoryIntegration: !!memoryContext,
          hallucinationPrevention: true,
          personalization: isPersonalQuery,
          educationalContent: isStudyQuery
        },
        memoryInfo: memoryContext ? {
          memoriesFound: memoryResult?.memories?.length || 0,
          personalFactsCount: memoryResult?.personalFacts?.length || 0,
          contextLength: memoryContext.contextString?.length || 0,
          queryTriggered: isPersonalQuery
        } : null
      },
      ...(memoryContext && {
        data: {
          ...aiResponse.data,
          response: {
            ...aiResponse.data?.response,
            memory_references: [`Memory context included: ${memoryContext.contextString?.substring(0, 100)}...`]
          }
        }
      })
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('Study buddy endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        studyBuddy: {
          isStudyBuddy: true,
          error: true
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for study buddy
  try {
    return NextResponse.json({
      status: 'healthy',
      endpoint: 'study-buddy',
      timestamp: new Date().toISOString(),
      features: [
        'memory-integration',
        'hallucination-prevention',
        'personalization',
        'educational-content',
        'jee-preparation',
        'thermodynamics-teaching'
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}