// Google Drive Files API Endpoint - Phase 4
// Handle Google Drive file operations (list, search, get)

import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/ai/google-drive-integration';
import type { DriveSearchParams } from '@/types/google-drive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Handle status action for connection checking
    if (action === 'status') {
      const isAuthenticated = await googleDriveService.getAuthStatus(userId);
      return NextResponse.json({
        success: true,
        data: { 
          isAuthenticated,
          connectedAt: isAuthenticated ? new Date().toISOString() : null
        }
      });
    }

    // Check authentication status first for other actions
    const isAuthenticated = await googleDriveService.getAuthStatus(userId);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Google Drive' },
        { status: 401 }
      );
    }

    // Extract search parameters
    const params: DriveSearchParams = {
      query: searchParams.get('query') || undefined,
      mimeTypes: searchParams.get('mimeTypes')?.split(',') || undefined,
      folders: searchParams.get('folders')?.split(',') || undefined,
      dateRange: searchParams.get('after') || searchParams.get('before') ? {
        after: searchParams.get('after') || undefined,
        before: searchParams.get('before') || undefined
      } : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'modifiedTime',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      maxResults: parseInt(searchParams.get('maxResults') || '50')
    };

    const filesResponse = await googleDriveService.listFiles(userId, params);

    return NextResponse.json(filesResponse);

  } catch (error) {
    console.error('[Google Drive Files API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, fileId, searchQuery } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId and action parameters required' },
        { status: 400 }
      );
    }

    // Check authentication status
    const isAuthenticated = await googleDriveService.getAuthStatus(userId);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Google Drive' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'search':
        if (!searchQuery) {
          return NextResponse.json(
            { success: false, error: 'searchQuery required for search action' },
            { status: 400 }
          );
        }
        const searchResponse = await googleDriveService.searchFiles(userId, searchQuery);
        return NextResponse.json(searchResponse);

      case 'get':
        if (!fileId) {
          return NextResponse.json(
            { success: false, error: 'fileId required for get action' },
            { status: 400 }
          );
        }
        const file = await googleDriveService.getFile(userId, fileId);
        return NextResponse.json({
          success: true,
          data: file
        });

      case 'materials':
        const materials = await googleDriveService.listStudyMaterials(userId);
        return NextResponse.json({
          success: true,
          data: { materials }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported: search, get, materials' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Google Drive Files API] POST error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
