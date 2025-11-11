// Study Buddy Settings API Endpoint
// Dedicated endpoint for Study Buddy settings management

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/ai/settings-service';
import type { StudyBuddySettings } from '@/types/settings';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const settings = await settingsService.getUserSettings(userId);

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings.studyBuddy
    });

  } catch (error) {
    console.error('[Study Buddy Settings API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { success: false, error: 'userId and settings are required' },
        { status: 400 }
      );
    }

    // Validate Study Buddy settings structure
    const validationResult = validateStudyBuddySettings(settings);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid Study Buddy settings structure', 
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    const result = await settingsService.updateStudyBuddySettings(userId, settings);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Study Buddy settings updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Study Buddy Settings API] PUT error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Settings validation function
function validateStudyBuddySettings(settings: Partial<StudyBuddySettings>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Validate endpoints configuration
    if (settings.endpoints) {
      const validEndpoints = ['chat', 'embeddings', 'memoryStorage', 'orchestrator', 'personalized', 'semanticSearch', 'webSearch'];
      
      for (const endpoint of validEndpoints) {
        const endpointConfig = settings.endpoints[endpoint as keyof typeof settings.endpoints];
        if (endpointConfig) {
          if (typeof endpointConfig.enabled !== 'boolean') {
            errors.push(`endpoints.${endpoint}.enabled must be a boolean`);
          }
          if (typeof endpointConfig.provider !== 'string') {
            errors.push(`endpoints.${endpoint}.provider must be a string`);
          }
          if (typeof endpointConfig.model !== 'string') {
            errors.push(`endpoints.${endpoint}.model must be a string`);
          }
          if (typeof endpointConfig.timeout !== 'number' || endpointConfig.timeout < 5 || endpointConfig.timeout > 120) {
            errors.push(`endpoints.${endpoint}.timeout must be a number between 5 and 120`);
          }
        }
      }
    }

    // Validate global defaults
    if (settings.globalDefaults) {
      if (typeof settings.globalDefaults.provider !== 'string') {
        errors.push('globalDefaults.provider must be a string');
      }
      if (typeof settings.globalDefaults.model !== 'string') {
        errors.push('globalDefaults.model must be a string');
      }
    }

    // Validate boolean flags
    if (typeof settings.enableHealthMonitoring !== 'boolean') {
      errors.push('enableHealthMonitoring must be a boolean');
    }
    if (typeof settings.testAllEndoints !== 'boolean') {
      errors.push('testAllEndoints must be a boolean');
    }

  } catch (error) {
    errors.push('Invalid Study Buddy settings format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}