// Student Profile API Endpoint - Simplified and Robust
// ==================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Response interface
interface ProfileResponse {
  success: boolean;
  data: {
    profileText: string;
    strongSubjects: string[];
    weakSubjects: string[];
    examTarget?: string;
    studyProgress: {
      totalTopics: number;
      completedTopics: number;
      accuracy: number;
    };
    currentData: {
      streak: number;
      level: number;
      points: number;
      revisionQueue: number;
    };
    lastUpdated: string;
  };
  error?: string;
}

// Default fallback profile response
const getDefaultProfileResponse = (): ProfileResponse => ({
  success: true,
  data: {
    profileText: 'Welcome to your study journey! Start by exploring subjects and topics.',
    strongSubjects: [],
    weakSubjects: [],
    studyProgress: {
      totalTopics: 0,
      completedTopics: 0,
      accuracy: 0
    },
    currentData: {
      streak: 0,
      level: 1,
      points: 0,
      revisionQueue: 0
    },
    lastUpdated: new Date().toISOString()
  }
});

/**
 * GET /api/student/profile
 * Get student profile for Study Buddy display
 * Simplified version with robust error handling and fallbacks
 */
export async function GET(request: NextRequest): Promise<NextResponse<ProfileResponse>> {
  console.log('📋 Student Profile API - Request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('📋 UserId from request:', userId);

    if (!userId) {
      console.log('⚠️  Missing userId parameter');
      return NextResponse.json(
        {
          success: false,
          error: 'userId parameter is required',
          data: getDefaultProfileResponse().data
        },
        { status: 400 }
      );
    }

    // Validate userId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('⚠️  Invalid userId format:', userId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid userId format',
          data: getDefaultProfileResponse().data
        },
        { status: 400 }
      );
    }

    console.log('✅ UserId validation passed');

    // Try to fetch profile from database with error handling
    let profileData = null;
    try {
      console.log('🔍 Attempting to fetch profile from database...');
      const { data, error } = await supabase
        .from('student_ai_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('⚠️  Database error:', error.message);
        if (error.code === 'PGRST116') {
          console.log('📝 No existing profile found, will create new one');
        } else {
          console.log('❌ Database query failed:', error.code, error.message);
        }
      } else {
        profileData = data;
        console.log('✅ Profile data fetched successfully');
      }
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      // Continue with fallback - don't fail the entire request
    }

    let responseData: ProfileResponse['data'];

    if (profileData) {
      // Use existing database profile
      console.log('📊 Using existing database profile');
      responseData = {
        profileText: profileData.profile_text || 'Welcome to your study journey!',
        strongSubjects: profileData.strong_subjects || [],
        weakSubjects: profileData.weak_subjects || [],
        examTarget: profileData.exam_target,
        studyProgress: {
          totalTopics: 0, // Default values since we don't have topic data yet
          completedTopics: 0,
          accuracy: 0
        },
        currentData: {
          streak: 0,
          level: profileData.learning_style === 'Advanced' ? 2 : 1,
          points: 0,
          revisionQueue: 0
        },
        lastUpdated: profileData.last_updated || new Date().toISOString()
      };
    } else {
      // Create and store a default profile
      console.log('🆕 Creating default profile');
      responseData = getDefaultProfileResponse().data;

      try {
        const { error: insertError } = await supabase
          .from('student_ai_profile')
          .upsert({
            user_id: userId,
            profile_text: responseData.profileText,
            strong_subjects: responseData.strongSubjects,
            weak_subjects: responseData.weakSubjects,
            learning_style: 'Beginner',
            exam_target: responseData.examTarget,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.warn('⚠️  Failed to create default profile:', insertError.message);
          // Don't fail the request, just warn
        } else {
          console.log('✅ Default profile created successfully');
        }
      } catch (insertError) {
        console.warn('⚠️  Profile creation error:', insertError);
        // Continue with default response anyway
      }
    }

    const response: ProfileResponse = {
      success: true,
      data: responseData
    };

    console.log('🎉 Profile response prepared successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Unexpected error in profile API:', error);

    // Always return a valid response, never crash
    const fallbackResponse: ProfileResponse = {
      success: true,
      data: getDefaultProfileResponse().data
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
