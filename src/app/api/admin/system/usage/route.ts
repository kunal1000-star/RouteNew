import { NextRequest, NextResponse } from 'next/server';
import { aiServiceManager } from '@/lib/ai/ai-service-manager';
import { rateLimitTracker } from '@/lib/ai/rate-limit-tracker';
import { responseCache } from '@/lib/ai/response-cache';

// GET /api/admin/system/usage
export async function GET(request: NextRequest) {
  try {
    const stats = await aiServiceManager.getStatistics();
    
    const mockUsage = {
      totalRequests: 15234,
      successfulRequests: 14987,
      failedRequests: 247,
      averageLatency: 287,
      topProviders: [
        { name: 'groq', requests: 4521, percentage: 29.7 },
        { name: 'gemini', requests: 3847, percentage: 25.3 },
        { name: 'cerebras', requests: 2934, percentage: 19.3 },
        { name: 'mistral', requests: 2156, percentage: 14.2 },
        { name: 'openrouter', requests: 1234, percentage: 8.1 },
        { name: 'cohere', requests: 542, percentage: 3.4 }
      ],
      costEstimate: 12.45
    };

    return NextResponse.json(mockUsage);
  } catch (error) {
    console.error('Usage stats failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}