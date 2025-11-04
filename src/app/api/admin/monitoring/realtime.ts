import { NextRequest, NextResponse } from 'next/server';
import { aiServiceManager } from '@/lib/ai/ai-service-manager';

// GET /api/admin/monitoring/realtime
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('range') || '1h';
    
    // Generate mock real-time metrics
    const now = new Date();
    const metrics = [];
    
    // Generate data points for the specified time range
    const intervals = timeRange === '1h' ? 12 : timeRange === '6h' ? 36 : timeRange === '24h' ? 144 : 168;
    const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : timeRange === '6h' ? 10 * 60 * 1000 : 60 * 60 * 1000;
    
    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));
      metrics.push({
        timestamp: timestamp.toISOString(),
        requestsPerMinute: Math.floor(Math.random() * 50) + 20,
        averageLatency: Math.floor(Math.random() * 500) + 200,
        successRate: 85 + Math.random() * 15,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 5,
        costPerMinute: Math.random() * 2 + 0.5
      });
    }

    // Get current provider status
    const healthStatus = await aiServiceManager.healthCheck();
    const providerMetrics = [
      {
        name: 'Groq',
        status: healthStatus.groq?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.groq?.responseTime || 0,
        requests: Math.floor(Math.random() * 1000) + 500,
        errors: Math.floor(Math.random() * 5),
        availability: 98 + Math.random() * 2,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Gemini',
        status: healthStatus.gemini?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.gemini?.responseTime || 0,
        requests: Math.floor(Math.random() * 800) + 400,
        errors: Math.floor(Math.random() * 10),
        availability: 95 + Math.random() * 5,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Cerebras',
        status: healthStatus.cerebras?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.cerebras?.responseTime || 0,
        requests: Math.floor(Math.random() * 600) + 300,
        errors: Math.floor(Math.random() * 3),
        availability: 99 + Math.random() * 1,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Cohere',
        status: healthStatus.cohere?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.cohere?.responseTime || 0,
        requests: Math.floor(Math.random() * 200) + 100,
        errors: Math.floor(Math.random() * 20),
        availability: 90 + Math.random() * 10,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Mistral',
        status: healthStatus.mistral?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.mistral?.responseTime || 0,
        requests: Math.floor(Math.random() * 400) + 200,
        errors: Math.floor(Math.random() * 8),
        availability: 97 + Math.random() * 3,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'OpenRouter',
        status: healthStatus.openrouter?.healthy ? 'online' : 'offline',
        responseTime: healthStatus.openrouter?.responseTime || 0,
        requests: Math.floor(Math.random() * 300) + 150,
        errors: Math.floor(Math.random() * 15),
        availability: 94 + Math.random() * 6,
        lastCheck: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      metrics,
      providers: providerMetrics,
      lastUpdate: new Date().toISOString(),
      timeRange
    });
  } catch (error) {
    console.error('Real-time monitoring failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time monitoring data' },
      { status: 500 }
    );
  }
}