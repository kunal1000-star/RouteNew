import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const mock = {
    totalCalls: 0,
    tokensUsed: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    providerStats: {},
  };
  return NextResponse.json(mock);
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
