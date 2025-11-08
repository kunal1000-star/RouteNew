import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || 50);
  return NextResponse.json({ events: [], limit });
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
