import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mock data for model overrides (in a real app, this would be stored in a database)
let modelOverrides: any[] = [
  {
    id: 'override_groq_llama',
    name: 'Groq Llama Default',
    provider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    enabled: true,
    parameters: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0
    },
    customInstructions: 'Default configuration for Groq Llama models'
  }
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAdminAccess(request: NextRequest): Promise<{authorized: boolean; message?: string}> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return { authorized: false, message: 'No authorization header' };
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { authorized: false, message: 'Invalid or expired token' };
    return { authorized: true };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false, message: 'Authentication check failed' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.message }, { status: 403 });
    }

    console.log('🔍 GET /api/admin/model-overrides - returning overrides:', modelOverrides);

    return NextResponse.json({
      success: true,
      data: modelOverrides
    });

  } catch (error) {
    console.error('❌ Error in GET /api/admin/model-overrides:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }

export async function POST(request: NextRequest) {
  try {
    const overrides = await request.json();
    if (!Array.isArray(overrides) && !Array.isArray(overrides?.overrides)) {
      return NextResponse.json({ success: false, error: 'Invalid data format: expected array of overrides' }, { status: 400 });
    }
    modelOverrides = Array.isArray(overrides) ? overrides : overrides.overrides;
    return NextResponse.json({ success: true, data: modelOverrides });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.message }, { status: 403 });
    }

    let overrides;
    
    try {
      overrides = await request.json();
      console.log('💾 PUT /api/admin/model-overrides - received overrides:', overrides);
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate that we received an array
    if (!Array.isArray(overrides)) {
      console.error('❌ Invalid data format: expected array of overrides, got:', typeof overrides);
      return NextResponse.json(
        { success: false, error: 'Invalid data format: expected array of overrides' },
        { status: 400 }
      );
    }

    // Update the in-memory storage (in a real app, save to database)
    modelOverrides = overrides;

    console.log('✅ Model overrides saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Model overrides saved successfully',
      data: modelOverrides
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/admin/model-overrides:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}