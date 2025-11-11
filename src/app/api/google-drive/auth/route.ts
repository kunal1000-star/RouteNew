// Google Drive Authentication API Route
// =====================================
// Handles OAuth 2.0 authentication flow for Google Drive

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/services/google-drive-service';

export async function GET(request: NextRequest) {
  try {
    const service = getGoogleDriveService();
    const authUrl = await service.getAuthUrl();
    
    return NextResponse.json({
      success: true,
      data: {
        authUrl,
      },
    });
  } catch (error) {
    console.error('Failed to get auth URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate authentication URL',
      },
      { status: 500 }
    );
  }
}

// POST: Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization code is required',
        },
        { status: 400 }
      );
    }

    const service = getGoogleDriveService();
    const auth = await service.handleAuthCallback(code);

    // In a real application, you would store these tokens securely
    // For now, we'll return them to be stored in the client or session
    return NextResponse.json({
      success: true,
      data: {
        auth,
        // You might want to store this server-side for better security
        message: 'Authentication successful. Please securely store these tokens.',
      },
    });
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
      },
      { status: 500 }
    );
  }
}