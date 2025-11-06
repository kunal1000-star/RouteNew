// Streaming Chat API Route - Enhanced with Error Handling
// ======================================================

import { NextRequest } from 'next/server';
import type { AIProvider } from '@/types/api-test';

// Simple request interface
interface ChatApiRequest {
  message: string;
  provider?: AIProvider;
  context?: any;
  preferences?: any;
  sessionId?: string;
}

// Graceful chat service initialization
async function getChatServiceSafely() {
  try {
    const { getChatService, getInitializedChatService } = await import('@/lib/ai/chat/simple-index');
    
    try {
      const service = getChatService();
      return { service, error: null, initialized: true };
    } catch (getError) {
      const service = await getInitializedChatService();
      return { service, error: null, initialized: true };
    }
  } catch (importError) {
    console.warn('Chat service initialization failed:', importError instanceof Error ? importError.message : String(importError));
    return {
      service: null,
      error: importError instanceof Error ? importError.message : String(importError),
      initialized: false,
      reason: 'Chat service modules not available'
    };
  }
}

// Mock streaming response for fallback
function createMockStreamingResponse(message: string, sessionId?: string) {
  return {
    id: `mock-stream-${Date.now()}`,
    content: `Streaming response for: "${message}". The advanced AI service is temporarily unavailable. This is a fallback response.`,
    provider: 'mock-stream',
    model: 'fallback-v1',
    tokensUsed: 25,
    timestamp: new Date(),
    metadata: {
      offlineMode: true,
      originalMessage: message
    }
  };
}

// POST /api/chat/stream - Stream a chat message
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    // Parse request body
    const body = await request.json() as ChatApiRequest;
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: {
            code: 'INVALID_REQUEST',
            message: 'Message is required and must be a string',
          }
        })}\n\n`),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Get chat service safely
    const { service: chatService, initialized } = await getChatServiceSafely();
    
    // Convert API request to internal format
    const chatRequest = {
      message: body.message,
      context: body.context,
      preferences: {
        ...body.preferences,
        streamResponses: true, // Enable streaming
      },
      provider: body.provider as AIProvider,
      sessionId: body.sessionId,
      stream: true,
    };

    // Create readable stream
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          const initialChunk = {
            type: 'start',
            data: {
              sessionId: chatRequest.sessionId,
              provider: chatRequest.provider || 'auto',
              timestamp: new Date().toISOString(),
              serviceInitialized: initialized,
            }
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialChunk)}\n\n`));
          
          // Simulate streaming response
          const mockResponse = createMockStreamingResponse(body.message, body.sessionId);
          
          // Send content in chunks
          const chunks = mockResponse.content.split(' ');
          for (let i = 0; i < chunks.length; i++) {
            const chunkData = {
              type: 'content',
              data: chunks[i] + ' ',
              timestamp: new Date().toISOString(),
              id: `chunk-${i}`,
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`));
            
            // Small delay to simulate streaming
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Send completion signal
          const endChunk = {
            type: 'end',
            data: {
              message: 'Stream completed successfully',
              timestamp: new Date().toISOString(),
              totalTokens: mockResponse.tokensUsed,
            }
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          
          // Send error chunk
          const errorChunk = {
            type: 'error',
            error: {
              code: 'STREAMING_ERROR',
              message: error instanceof Error ? error.message : 'Streaming failed',
              details: error instanceof Error ? error.stack : String(error),
            },
            timestamp: new Date().toISOString(),
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    
    const errorResponse = {
      type: 'error',
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      },
      timestamp: new Date().toISOString(),
    };
    
    return new Response(
      encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}