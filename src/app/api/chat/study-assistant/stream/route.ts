import { NextRequest } from 'next/server';
import { getInitializedChatService } from '@/lib/ai/chat';
import { buildStudentContext, determineContextLevel } from '@/lib/ai/student-context-builder';
export async function POST(request: NextRequest) {
  try {
    const encoder = new TextEncoder();
    const body = await request.json();
    const { message, sessionId, userId, isPersonalQuery, conversationId } = body || {};
    if (!message) {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type:'error', error:{ code:'INVALID_REQUEST', message:'message is required' }})}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const chatService = await getInitializedChatService();

    // Build study context when personal mode is enabled
    let studyContext: any = undefined;
    try {
      if (userId && isPersonalQuery) {
        const level = determineContextLevel(message, true);
        studyContext = await buildStudentContext(userId, level);
      }
    } catch (e) {
      // Non-fatal; continue without context
      studyContext = undefined;
    }

    const prefs = { streamResponses: true, isPersonalQuery: !!isPersonalQuery };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'start', data:{ timestamp:new Date().toISOString(), personal: !!isPersonalQuery }})}\n\n`));
          const stream = chatService.streamMessage({
            message,
            sessionId: conversationId || sessionId,
            context: studyContext ? { studyContext } : undefined,
            preferences: prefs,
            provider: undefined,
          });
          for await (const chunk of stream as any) {
            if (chunk.type === 'content') controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'content', data: chunk.data })}\n\n`));
            else if (chunk.type === 'metadata') controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'metadata', data: chunk.data })}\n\n`));
            else if (chunk.type === 'error') controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'error', error: chunk.data })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'end', data:{ timestamp:new Date().toISOString() }})}\n\n`));
          controller.close();
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type:'error', error:{ code:'STREAMING_ERROR', message: e instanceof Error ? e.message : 'Streaming failed' }})}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  } catch (e) {
    return new Response(`data: ${JSON.stringify({ type:'error', error:{ message: e instanceof Error ? e.message : 'Stream error' }})}\n\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
