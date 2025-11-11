// Google Drive Save History API Route
// ===================================
// Handles save history and quick access features

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const contentType = searchParams.get('content_type');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('saved_content')
      .select(`
        id,
        content_type,
        conversation_id,
        message_id,
        content_preview,
        save_format,
        file_name,
        drive_file_url,
        folder_path,
        ai_enhanced,
        ai_summary,
        ai_tags,
        ai_themes,
        metadata,
        created_at,
        save_history!inner(
          action_type,
          action_timestamp,
          source_device
        )
      `)
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: savedContent, error } = await query;

    if (error) {
      console.error('Failed to fetch save history:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch save history',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: savedContent || [],
        total: savedContent?.length || 0,
        hasMore: (savedContent?.length || 0) === limit,
        offset,
        limit,
      },
    });

  } catch (error) {
    console.error('Save history fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch save history',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    const { savedContentId, action } = await request.json();

    if (!savedContentId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saved content ID and action are required',
        },
        { status: 400 }
      );
    }

    // Log the action
    const { error } = await supabase
      .from('save_history')
      .insert({
        user_id: userId,
        saved_content_id: savedContentId,
        action_type: action,
        action_timestamp: new Date().toISOString(),
        source_device: request.headers.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      });

    if (error) {
      console.error('Failed to log action:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to log action',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Action logged successfully',
    });

  } catch (error) {
    console.error('Save history logging error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to log action',
      },
      { status: 500 }
    );
  }
}

// Get save statistics
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User authentication required',
        },
        { status: 401 }
      );
    }

    // Get comprehensive statistics
    const [totalSaved, byType, recentActivity, aiEnhanced] = await Promise.all([
      // Total saved items
      supabase
        .from('saved_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Breakdown by content type
      supabase
        .from('saved_content')
        .select('content_type')
        .eq('user_id', userId),

      // Recent activity (last 30 days)
      supabase
        .from('saved_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // AI enhanced content
      supabase
        .from('saved_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('ai_enhanced', true),
    ]);

    // Count by type
    const typeCounts: Record<string, number> = {};
    byType.data?.forEach(item => {
      typeCounts[item.content_type] = (typeCounts[item.content_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSaved: totalSaved.count || 0,
        recentActivity: recentActivity.count || 0,
        aiEnhanced: aiEnhanced.count || 0,
        byType: typeCounts,
        lastActivity: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Save statistics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}