import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = {
    providers: [],
    usageStats: {
      totalCalls: 0,
      tokensUsed: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    },
  };
  return NextResponse.json(data);
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
