import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SETTINGS = {
  general: {
    webSearchEnabled: false,
    showModelName: true,
    showResponseTime: false,
    cacheTTL: 300,
  },
  studyAssistant: {
    memorySystemEnabled: true,
    contextInclusionEnabled: true,
    memoryRetentionDays: 30,
    cacheTTL: 300,
  },
  language: {
    responseLanguage: 'en',
    hinglishEnforcement: false,
  },
};

let currentSettings = { ...DEFAULT_SETTINGS };

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, ...currentSettings });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    currentSettings = { ...currentSettings, ...body };
    return NextResponse.json({ success: true, ...currentSettings });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }
