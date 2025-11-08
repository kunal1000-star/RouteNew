// Streaming Chat API Route - Enhanced with Error Handling
// ======================================================

import { NextRequest } from 'next/server';
import { getInitializedChatService } from '@/lib/ai/chat';
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

// Remove mock; will use real streaming
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
      sessionId: body.conversationId || body.sessionId,
      stream: true,
    };

    // Create readable stream from unified chat service
    const readable = new ReadableStream({
      async start(controller) {
        const abort = request.signal;
        try {
          const chatService = await getInitializedChatService();

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

          const stream = chatService.streamMessage({
            message: chatRequest.message,
            context: chatRequest.context,
            preferences: { ...chatRequest.preferences, streamResponses: true },
            provider: chatRequest.provider,
            sessionId: chatRequest.sessionId,
          });

          for await (const chunk of stream as any) {
            if (abort.aborted) break;
            if (chunk.type === 'content') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', data: chunk.data })}\n\n`));
            } else if (chunk.type === 'metadata') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: chunk.data })}\n\n`));
            } else if (chunk.type === 'error') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: chunk.data })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', data: { timestamp: new Date().toISOString() } })}\n\n`));
          controller.close();
        } catch (error) {
          const errorChunk = {
            type: 'error',
            error: {
              code: 'STREAMING_ERROR',
              message: error instanceof Error ? error.message : 'Streaming failed',
            },
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
      cancel() {
        // nothing special; relying on request.signal
      }
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