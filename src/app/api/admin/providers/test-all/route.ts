import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({});
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
