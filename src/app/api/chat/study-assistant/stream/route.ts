import { NextRequest } from 'next/server';
import { getInitializedChatService } from '@/lib/ai/chat';
import { buildStudentContext, determineContextLevel } from '@/lib/ai/student-context-builder';
import {
  validateStudyResponse,
  checkEducationalFacts,
  assessResponseConfidence,
  detectContradictions
} from '@/lib/hallucination-prevention/layer3/response-validation-integration';

// Simple personal query detection
function detectPersonalQuestion(message: string): boolean {
  const personalKeywords = [
    'my', 'me', 'my account', 'my profile', 'my progress', 'my grade',
    'my score', 'my performance', 'my results', 'personal', 'my data'
  ];
  
  return personalKeywords.some(keyword =>
    message.toLowerCase().includes(keyword)
  );
}

// Classify message type for processing
function classifyMessageType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('doubt')) {
    return 'doubt';
  } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
    return 'explanation_request';
  } else if (lowerMessage.includes('practice') || lowerMessage.includes('exercise') || lowerMessage.includes('problem')) {
    return 'practice';
  } else if (lowerMessage.includes('progress') || lowerMessage.includes('grade') || lowerMessage.includes('score')) {
    return 'progress_inquiry';
  } else if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('understand')) {
    return 'study_help';
  } else {
    return 'general';
  }
}

// Layer 1 Input Validation & Query Classification for Stream
async function processWithLayer1Validation(
  userId: string,
  sessionId: string,
  conversationId: string,
  message: string,
  isPersonalQuery: boolean
): Promise<{
  isValid: boolean;
  validationResult?: any;
  classificationResult?: any;
  enhancedMessage?: string;
  studyContext?: any;
  recommendations?: string[];
  warnings?: string[];
  actualIsPersonalQuery: boolean;
}> {
  try {
    // For now, use basic validation since Layer 1 is not available
    const isValid = true;
    const actualIsPersonalQuery = detectPersonalQuestion(message);
    const messageType = classifyMessageType(message);
    
    return {
      isValid,
      validationResult: null,
      classificationResult: {
        type: actualIsPersonalQuery ? 'personal' : 'general',
        intent: actualIsPersonalQuery ? 'personal_query' : 'educational',
        messageType
      },
      enhancedMessage: message,
      studyContext: {
        academicLevel: 'high_school',
        contextRequirement: actualIsPersonalQuery ? 'personal' : 'general',
        responseStrategy: actualIsPersonalQuery ? 'personalized' : 'educational'
      },
      recommendations: [],
      warnings: [],
      actualIsPersonalQuery
    };

  } catch (error) {
    console.warn('Layer 1 processing failed, proceeding with basic validation:', error);
    return {
      isValid: true,
      actualIsPersonalQuery: isPersonalQuery,
      recommendations: ['Layer 1 validation unavailable'],
      warnings: ['Enhanced validation not available']
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const encoder = new TextEncoder();
    const body = await request.json();
    const { message, sessionId, userId, isPersonalQuery = false, conversationId } = body || {};
    
    if (!message) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type:'error', error:{ code:'INVALID_REQUEST', message:'message is required' }})}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    if (!userId) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type:'error', error:{ code:'INVALID_REQUEST', message:'userId is required' }})}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // Layer 1: Input validation and query classification
    const actualSessionId = sessionId || `stream_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const actualConversationId = conversationId || 'stream_conversation';
    
    const layer1Result = await processWithLayer1Validation(
      userId,
      actualSessionId,
      actualConversationId,
      message,
      isPersonalQuery
    );

    // Handle validation failures
    if (!layer1Result.isValid) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({
          type:'error',
          error: {
            code:'VALIDATION_FAILED',
            message:'Input validation failed',
            warnings: layer1Result.warnings
          }
        })}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // Use enhanced message from Layer 1 if available
    const processedMessage = layer1Result.enhancedMessage || message;
    
    const chatService = await getInitializedChatService();

    // Build study context when personal mode is enabled
    let studyContext: any = undefined;
    try {
      if (userId && layer1Result.actualIsPersonalQuery) {
        const level = determineContextLevel(processedMessage, true);
        studyContext = await buildStudentContext(userId, level);
        
        if (layer1Result.studyContext) {
          studyContext = {
            ...studyContext,
            layer1Enhancement: layer1Result.studyContext
          };
        }
      }
    } catch (e) {
      studyContext = undefined;
    }

    const prefs = {
      streamResponses: true,
      isPersonalQuery: layer1Result.actualIsPersonalQuery
    };

    // Include Layer 1 and Layer 3 enhancements in the streaming response
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send start event with Layer 1 metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type:'start',
            data: {
              timestamp: new Date().toISOString(),
              personal: layer1Result.actualIsPersonalQuery,
              layer1Results: {
                isValid: layer1Result.isValid,
                classification: layer1Result.classificationResult,
                studyContext: layer1Result.studyContext,
                recommendations: layer1Result.recommendations,
                warnings: layer1Result.warnings
              }
            }
          })}\n\n`));
          
          const stream = chatService.streamMessage({
            message: processedMessage,
            sessionId: conversationId || sessionId,
            context: studyContext ? { studyContext } : undefined,
            preferences: prefs,
            provider: undefined
          });
          
          let contentBuffer = '';
          
          for await (const chunk of stream as any) {
            if (chunk.type === 'content') {
              contentBuffer += chunk.data;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'content', data: chunk.data })}\n\n`));
            }
            else if (chunk.type === 'metadata') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'metadata', data: chunk.data })}\n\n`));
            }
            else if (chunk.type === 'error') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'error', error: chunk.data })}\n\n`));
            }
          }
          
          // Layer 3: Response validation for streaming response
          let layer3Results = null;
          try {
            const layer3Request = {
              response: {
                id: `stream_response_${Date.now()}`,
                content: contentBuffer,
                metadata: {
                  streamType: 'sse',
                  sessionId: actualSessionId
                }
              },
              originalRequest: {
                userId,
                sessionId: actualSessionId,
                conversationId: actualConversationId,
                message: processedMessage,
                messageType: layer1Result.classificationResult?.messageType || 'general',
                academicLevel: 'high_school' as any,
                urgency: 'medium' as any,
                includeEducationalContext: true,
                requireSourceVerification: false,
                metadata: {}
              } as any,
              context: {
                knowledgeBase: [],
                conversationHistory: [],
                externalSources: [],
                userProfile: null
              },
              validationOptions: {
                validationLevel: 'standard' as any,
                includeFactChecking: true,
                includeConfidenceScoring: true,
                includeContradictionDetection: true
              }
            };

            layer3Results = await validateStudyResponse(layer3Request);
            
          } catch (layer3Error) {
            console.warn('Layer 3 validation failed in stream:', layer3Error);
          }
          
          // Send end event with Layer 1 and Layer 3 processing summary
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type:'end',
            data: {
              timestamp: new Date().toISOString(),
              layer1Results: {
                classification: layer1Result.classificationResult,
                studyContext: layer1Result.studyContext,
                recommendations: layer1Result.recommendations
              },
              layer3Results: layer3Results ? {
                isValid: layer3Results.isValid,
                validationScore: layer3Results.validationScore,
                issues: layer3Results.issues?.length || 0,
                processingTime: layer3Results.processingTime
              } : null
            }
          })}\n\n`));
          
          controller.close();
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type:'error',
            error: {
              code:'STREAMING_ERROR',
              message: e instanceof Error ? e.message : 'Streaming failed',
              layer1Warnings: layer1Result.warnings
            }
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (e) {
    return new Response(`data: ${JSON.stringify({
      type:'error',
      error: {
        message: e instanceof Error ? e.message : 'Stream error'
      }
    })}\n\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 200, 
    headers: { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 
      'Access-Control-Allow-Headers': 'Content-Type' 
    } 
  });
}
