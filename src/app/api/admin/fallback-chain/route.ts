import { NextRequest, NextResponse } from 'next/server';

let fallbackChain: Array<{ provider: string; tier: number; enabled: boolean }>= [];

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, fallbackChain });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      fallbackChain = body as any;
    } else if (Array.isArray(body?.fallbackChain)) {
      fallbackChain = body.fallbackChain;
    }
    return NextResponse.json({ success: true, fallbackChain });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
