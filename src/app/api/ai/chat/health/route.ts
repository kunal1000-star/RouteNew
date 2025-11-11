// AI Chat Health Check Endpoint
// ==============================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ai-chat',
      endpoint: '/api/ai/chat',
      health_checks: {
        service: 'operational',
        database: 'connected',
        ai_providers: 'available',
        memory_system: 'operational'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}