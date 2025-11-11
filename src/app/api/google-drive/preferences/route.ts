// Google Drive User Preferences API Route
// =========================================
// Handles user preferences for Google Drive integration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user ID from request (in real app, use proper auth)
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

    const { data: preferences, error } = await supabase
      .from('drive_user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Failed to fetch preferences:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch preferences',
        },
        { status: 500 }
      );
    }

    // Return default preferences if none found
    if (!preferences) {
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          autoSync: true,
          preferredFolder: 'StudyBuddy/Saved Content',
          saveFormatDefault: 'txt',
          aiEnhancement: true,
          createSummaries: true,
          autoTagging: true,
          backupFrequency: 'daily',
          allowedMimeTypes: ['text/plain', 'text/markdown', 'application/pdf'],
          maxFileSizeMB: 25,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });

  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user preferences',
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

    // Get user ID from request
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

    const preferences = await request.json();

    // Validate preferences
    const allowedFields = [
      'isConnected', 'accessToken', 'refreshToken', 'tokenExpiresAt',
      'autoSync', 'preferredFolder', 'saveFormatDefault', 'aiEnhancement',
      'createSummaries', 'autoTagging', 'backupFrequency', 'allowedMimeTypes',
      'maxFileSizeMB'
    ];

    const validPreferences: any = { user_id: userId };
    
    for (const [key, value] of Object.entries(preferences)) {
      if (allowedFields.includes(key)) {
        validPreferences[key === 'isConnected' ? key : key.toLowerCase()] = value;
      }
    }

    // Upsert preferences
    const { data, error } = await supabase
      .from('drive_user_preferences')
      .upsert(validPreferences, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save preferences:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save preferences',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Preferences saved successfully',
    });

  } catch (error) {
    console.error('Preferences save error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save user preferences',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { error } = await supabase
      .from('drive_user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete preferences:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete preferences',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences deleted successfully',
    });

  } catch (error) {
    console.error('Preferences delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user preferences',
      },
      { status: 500 }
    );
  }
}